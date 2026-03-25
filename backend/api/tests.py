"""
API Test Suite
==============
Covers:
- Ajax utility endpoints
- Registration & login
- User verification
- Listings CRUD & visibility rules
- Transactions & balance constraints
"""

from django.contrib.auth import get_user_model
from django.conf import settings
from django.contrib.auth.hashers import make_password
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token

from coinapp.models import Exchange, Listing

User = get_user_model()

BASE_URL = "/api/v1/"

# ---------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------

print_json = lambda r: print(r.json())


def sample_image():
    """
    Returns a tiny valid image file for upload testing
    """
    from django.core.files.uploadedfile import SimpleUploadedFile

    small_img = (
        b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00'
        b'\x05\x04\x04\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00'
        b'\x01\x00\x00\x02\x02\x44\x01\x00\x3b'
    )
    return SimpleUploadedFile(
        'small.gif',
        small_img,
        content_type='image/png'
    )

# =====================================================================
# AJAX ENDPOINT TESTS
# =====================================================================

class AjaxViewsTest(APITestCase):
    fixtures = ["test.json"]

    def test_dropdowns(self):
        """
        Verify dropdown ajax data (categories)
        """
        response = self.client.get(f"{BASE_URL}ajax/?purpose=categories")
        self.assertEqual(
            response.json()['data'][0],
            ['Accommodation_Space', 'Accommodation and Space']
        )

    def test_balance_logout(self):
        """
        User balance endpoint should work with token auth
        """
        token = Token.objects.get_or_create(user_id=1)[0]
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key)

        response = self.client.get(f"{BASE_URL}ajax/?purpose=userbalance")
        self.assertEqual(response.json()['data'], 0)

# =====================================================================
# REGISTRATION & LOGIN
# =====================================================================

class RegistrationTest(APITestCase):
    def setUp(self):
        self.exchange_id = Exchange.objects.create(
            code="TEST",
            name="Test Exchange",
            address="Test Address",
            country_city="IN-KL",
            postal_code ="678686"
        ).id

    def create_user(self, i):
        data = {
            "first_name": f"User{i}",
            "email": f"user{i}@test.com",
            "phone": f"9000000{i}",
            "password": f"mypassword{i}",
            "exchange": self.exchange_id,
            "image": sample_image(),
        }
        return self.client.post(f"{BASE_URL}registration/", data)
    
    def test_create_user_and_login(self):
        """
        - Create user
        - Try login with wrong password
        - Try login with correct password but inactive user
        """

        # Create a new user
        response = self.create_user(i=1)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Login test cases
        test_cases = [
            # Wrong password
            {
                "password": "wrongpassword",
                "response": {
                    "non_field_errors": ["Unable to log in with provided credentials."]
                },
            },
            # Correct password but user not verified
            {
                "password": "mypassword1",
                "response": {
                    "is_active": False,
                    "message": "Verification is pending.",
                },
            },
        ]

        for case in test_cases:
            response = self.client.post(
                f"{BASE_URL}login/",
                {"username": "TEST00", "password": case["password"]},
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(response.json(), case["response"])

    def test_create_user_with_new_exchange(self):
        response = self.client.post(
            f"{BASE_URL}registration/",
            {
                "first_name": "nora",
                "password": "mypass1234",
                "phone": "9000000011",
                "exchange_code": "newx",
                "exchange_name": "New Exchange",
                "exchange_address": "Main Street",
                "exchange_country_city": "IN-KL",
                "exchange_postal_code": "673001",
                "image": sample_image(),
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_user = User.objects.get(username=response.data["username"])
        self.assertEqual(created_user.exchange.code, "NEWX")
        self.assertTrue(Exchange.objects.filter(code="NEWX").exists())

    def test_login_username_is_uppercased(self):
        response = self.create_user(i=2)        
        response = self.client.post(
            f"{BASE_URL}login/",
            {"username": "test00", "password": "mypassword2"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json(),
            {"is_active": False, "message": "Verification is pending."},
        )
    
    def test_101st_user_fails(self):
        """101st user should fail"""
        users = []
        password = make_password("StrongPassword123!")
        for i in range(99):
            users.append(
                User(
                    username=f"TEST{i:02}",
                    first_name=f"User{i}",
                    email=f"user{i}@test.com",
                    phone=f"900000{i}",
                    exchange_id=self.exchange_id,
                    password=password
                )
            )

        User.objects.bulk_create(users)
        response = self.create_user(i=100)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.create_user(i=101)
        self.assertEqual(response.status_code, 400)
        self.assertIn("This exchange already has 100 users", str(response.data))

        # test_deleted_username_reused
        User.objects.get(username="TEST03").delete()
        response = self.create_user(i=999)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_user = User.objects.get(email="user999@test.com")
        self.assertEqual(new_user.username, "TEST03")

# =====================================================================
# USER DETAILS
# =====================================================================

class UserDetailsTest(APITestCase):
    fixtures = ["test.json"]

    def test_user_details(self):
        """
        Login and fetch user detail endpoint
        """

        # Login
        response = self.client.post(
            f"{BASE_URL}login/",
            {"username": "KKDE01", "password": "sumee1910"},
        )
        token = response.json()["key"]
        # Fetch user details
        response = self.client.get(
            f"{BASE_URL}users/{User.objects.get(username='KKDE01').id}/",
            headers={"Authorization": f"Token {token}"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_users_list_only_shows_same_exchange_users(self):
        """
        users list endpoint should only return users from request user's exchange
        """
        token = Token.objects.get_or_create(user_id=1)[0]  # KKDE00 (exchange=1)
        response = self.client.get(
            f"{BASE_URL}users/",
            headers={"Authorization": f"Token {token}"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            all(user["exchange"] == 1 for user in response.data),
            "Found user(s) from another exchange in /users/ response",
        )
# =====================================================================
# USER VERIFICATION
# =====================================================================

class VerifyUserTest(APITestCase):
    fixtures = ["test.json"]

    def setUp(self):
        """
        Prepare verifier tokens
        """
        self.users = {
            "KKDE00": Token.objects.get_or_create(user_id=1)[0],  # same exchange
            "PIXL00": Token.objects.get_or_create(user_id=4)[0],  # different exchange
        }

    def verify_sufail(self, token):
        """
        Helper to verify newly created user (sufail)
        """
        user_sufail = User.objects.get(username="KKDE02")

        response = self.client.post(
            f"{BASE_URL}verifyuser/",
            {"candidate_id": user_sufail.id},
            headers={"Authorization": f"Token {token}"},
        )

        # Only same-exchange users can verify
        if token == self.users["PIXL00"]:
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        else:
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        return response

    def test_create_and_verify_user(self):
        """
        Full verification lifecycle test
        """

        # Register new user
        response = self.client.post(
            f"{BASE_URL}registration/",
            {
                "first_name": "sufail",
                "password": "dummypassword",
                "phone": "dummyphone",
                "exchange": "1",
                "image": sample_image(),
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user_sufail = User.objects.get(username="KKDE02")

        # Login should fail (not verified)
        response = self.client.post(
            f"{BASE_URL}login/",
            {"username": "KKDE02", "password": "dummypassword"},
        )
        self.assertFalse(response.json()["is_active"])

        # Wrong exchange verification attempt
        self.verify_sufail(self.users["PIXL00"])
        user_sufail.refresh_from_db()
        self.assertFalse(user_sufail.is_active)

        # Correct exchange verification
        self.verify_sufail(self.users["KKDE00"])
        user_sufail.refresh_from_db()
        self.assertTrue(user_sufail.is_active)

        # Login succeeds after verification
        response = self.client.post(
            f"{BASE_URL}login/",
            {"username": "KKDE02", "password": "dummypassword"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

# =====================================================================
# LISTING TESTS
# =====================================================================

class ListingTest(APITestCase):
    fixtures = ["test.json"]

    def setUp(self):
        self.listing_id = 1
        self.url = f"{BASE_URL}listings/{self.listing_id}/"

        self.listing_exists = lambda: Listing.objects.filter(id=self.listing_id).exists()
        self.listing_active = lambda: Listing.objects.filter(
            id=self.listing_id, is_active=True
        ).exists()

        self.users = {
            "KKDE00": Token.objects.get_or_create(user_id=1)[0],
            "KKDE01": Token.objects.get_or_create(user_id=2)[0],
        }

    def test_list_listings(self):
        """
        Listings visibility based on ownership
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.users["KKDE00"].key)

        response = self.client.get(f"{BASE_URL}listings/?type=O&page=1&user=2")
        self.assertEqual(response.json()["results"], [])

        response = self.client.get(f"{BASE_URL}listings/?type=O&page=1&user=1")
        self.assertEqual(response.json()["results"][0]["title"], "rice")

    def test_all_listings_only_include_same_exchange(self):
        """
        user=all listing feed must be limited to request user's exchange
        """
        Listing.objects.create(
            user=User.objects.get(username="PIXL00"),
            category="Food_Drink",
            title="burger",
            description="cross exchange listing",
            rate="10",
            listing_type="O",
        )
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.users["KKDE00"].key)
        response = self.client.get(f"{BASE_URL}listings/?type=O&page=1&user=all")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("burger", [item["title"] for item in response.json()["results"]])

    def test_view_listing(self):
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.users["KKDE00"].key)
        response = self.client.get(self.url)
        self.assertEqual(response.json()["title"], "rice")

    def test_owner_can_delete(self):
        self.assertTrue(self.listing_exists())
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.users["KKDE00"].key)

        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(self.listing_exists())

    def test_other_user_cannot_delete(self):
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.users["KKDE01"].key)

        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(self.listing_exists())

    def test_owner_can_deactivate(self):
        """
        Owner can deactivate listing; others cannot see it
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.users["KKDE00"].key)

        response = self.client.patch(self.url, data={"is_active": False})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(self.listing_active())

        # Owner can still see inactive listing
        response = self.client.get(f"{BASE_URL}listings/?type=O&user=1")
        self.assertEqual(response.json()["results"][0]["title"], "rice")

        # Other users cannot
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.users["KKDE01"].key)
        response = self.client.get(f"{BASE_URL}listings/?type=O&user=1")
        self.assertEqual(response.json()["results"], [])
        # Other users cannot see even in all listing
        response = self.client.get(f"{BASE_URL}listings/?type=O&user=all")
        self.assertEqual(response.json()["results"], [])

# =====================================================================
# TRANSACTIONS
# =====================================================================

class TransactionTest(APITestCase):
    fixtures = ["test.json"]

    def setUp(self):
        self.user_nusra = User.objects.get(username="KKDE01")
        self.user_suhail = User.objects.get(username="KKDE00")

    def test_get_transactions(self):
        """
        Transaction visibility rules
        """
        token = Token.objects.get_or_create(user_id=3)[0]
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key)

        response = self.client.get(f"{BASE_URL}transactions/?user=2")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.get(f"{BASE_URL}transactions/?user=4")
        self.assertEqual(response.json()[0]["description"], "Badminton Court - Amigos Oct 29")

    def test_get_transactions_other_exchange_user_forbidden(self):
        """
        Should not allow viewing transactions of users from another exchange
        """
        token = Token.objects.get_or_create(user_id=1)[0]  # KKDE00 exchange=1
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key)
        response = self.client.get(f"{BASE_URL}transactions/?user=4")  # PIXL00 exchange=2
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_and_make_transaction(self):
        """
        Seller → buyer transaction & balance update
        """
        response = self.client.post(
            f"{BASE_URL}login/",
            {"username": "KKDE00", "password": "sumee1910"},
        )
        token = response.json()["key"]

        response = self.client.post(
            f"{BASE_URL}transactions/",
            {
                "user": self.user_nusra.id,
                "amount": 10,
                "message": "caring",
                "transaction_type":"buyer",
            },
            headers={"Authorization": f"Token {token}"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # check nusra has 10$ balance
        response = self.client.get(
            f"{BASE_URL}ajax/?purpose=userbalance", headers={"Authorization": f"Token {token}"}
        )
        self.assertEqual(response.json()['data'], -10)

        # login as nusra. check she has -10$ balance
        response = self.client.post(
            f"{BASE_URL}login/",
            {"username": "KKDE01", "password": "sumee1910"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["username"], "KKDE01")
        response = self.client.get(
            f"{BASE_URL}ajax/?purpose=userbalance",
            headers={"Authorization": f"Token {response.json()['key']}"},
        )
        self.assertEqual(response.json()['data'], 10)
    

    def test_txn_amt(self):
        """
        Invalid transaction amounts should fail
        """
        token = Token.objects.get_or_create(user_id=4)[0]

        for amt in ["0", "0.1", "-10", "0.9", "abcd", "1,3"]:
            response = self.client.post(
                f"{BASE_URL}transactions/",
                {
                    "user": User.objects.get(username="PIXL00").id,
                    "amount": amt,
                    "message": f"sending amount of {{amt}} to sabreesh must return error",
                    "transaction_type":"buyer",
                },
                headers={"Authorization": f"Token {token.key}"},
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            # print(response.json())

    def test_buyer_transaction(self):
        # test buyer transaction
        # check nusra has -13$ balance
        pass
    
    def test_send_transactions_only_to_own_exchange(self):
        # nusra is kolakkode exchange user, 
        # so must not able to send to sabareesh
        response = self.client.post(
            f"{BASE_URL}login/",
            {"username": "KKDE01", "password": "sumee1910"},
            format="json",
        )
        token = response.json()["key"]
        response = self.client.post(
            f"{BASE_URL}transactions/",
            {
                "user": User.objects.get(username="PIXL00").id,
                "amount": '101',
                "message": "sending amount of 101 to sabreesh must return error",
                "transaction_type":"buyer",
            },
            headers={"Authorization": f"Token {token}"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_max_balance(self):
        self.user_nusra.balance=settings.MAXIMUM_BALANCE-100
        self.user_nusra.save()

        # nusra has 900$, so nusra can only recieve max 100$
        # sending amount of 101 to nusra must return error
        response = self.client.post(
            f"{BASE_URL}login/",
            {"username": "KKDE01", "password": "sumee1910"},
            format="json",
        )
        token = response.json()["key"]
        response = self.client.post(
            f"{BASE_URL}transactions/",
            {
                "user": self.user_nusra.id,
                "amount": '101',
                "message": "sending amount of 101 to nusra must return error",
                "transaction_type":"buyer",
            },
            headers={"Authorization": f"Token {token}"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_min_balance(self):
        # nusra has -990$, so nusra can only send max 10$
        self.user_nusra.balance=settings.MINIMUM_BALANCE+10
        self.user_nusra.save()

        # send 11$ to suhail
        response = self.client.post(
            f"{BASE_URL}login/",
            {"username": "KKDE01", "password": "sumee1910"},
            format="json",
        )
        token = response.json()["key"]
        response = self.client.post(
            f"{BASE_URL}transactions/",
            {
                "user": self.user_suhail.id,
                "amount": 11,
                "message": "send 11$ to suhail must return error",
                "transaction_type":"buyer",
            },
            headers={"Authorization": f"Token {token}"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_block_11th_transaction(self):
        token = Token.objects.get_or_create(user=self.user_nusra)[0]
        create_txn = lambda: self.client.post(
            f"{BASE_URL}transactions/",
            {
                "user": self.user_suhail.id,
                "amount": 5,
                "message": "nusra receive 5 rs from suhail",
                "transaction_type":"seller",
            },
            headers={"Authorization": f"Token {token}"},
            format="json",
        )

        # allow_first_10_transactions
        for i in range(10):
            response = create_txn()
            self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = create_txn()
        # block_11th_transaction(daily txn limit)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Seller reached daily limit", str(response.data))

