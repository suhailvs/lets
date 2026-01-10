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

from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token

from coinapp.models import Listing

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
    fixtures = ["datas.json"]

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
    fixtures = ["datas.json"]

    def test_create_user_and_login(self):
        """
        - Create user
        - Try login with wrong password
        - Try login with correct password but inactive user
        """

        # Create a new user
        response = self.client.post(
            f"{BASE_URL}registration/",
            {
                "password": "mypass1234",
                "phone": "9000000000",
                "government_id": "123456",
                "date_of_birth": "1988-12-04",
                "exchange": "1",
                "image": sample_image(),
            },
        )
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
                "password": "mypass1234",
                "response": {
                    "is_active": False,
                    "message": "Verification is pending.",
                },
            },
        ]

        for case in test_cases:
            response = self.client.post(
                f"{BASE_URL}login/",
                {"username": "KKDE005", "password": case["password"]},
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(response.json(), case["response"])

# =====================================================================
# USER DETAILS
# =====================================================================

class UserDetailsTest(APITestCase):
    fixtures = ["datas.json"]

    def test_user_details(self):
        """
        Login and fetch user detail endpoint
        """

        # Login
        response = self.client.post(
            f"{BASE_URL}login/",
            {"username": "KKDE002", "password": "sumee1910"},
        )
        token = response.json()["key"]

        # Fetch user details
        response = self.client.get(
            f"{BASE_URL}users/{User.objects.get(username='KKDE002').id}/",
            headers={"Authorization": f"Token {token}"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

# =====================================================================
# USER VERIFICATION
# =====================================================================

class VerifyUserTest(APITestCase):
    fixtures = ["datas.json"]

    def setUp(self):
        """
        Prepare verifier tokens
        """
        self.users = {
            "KKDE001": Token.objects.get_or_create(user_id=1)[0],  # same exchange
            "PIXL001": Token.objects.get_or_create(user_id=4)[0],  # different exchange
        }

    def verify_sufail(self, token):
        """
        Helper to verify newly created user (sufail)
        """
        user_sufail = User.objects.get(username="KKDE005")

        response = self.client.post(
            f"{BASE_URL}verifyuser/",
            {"candidate_id": user_sufail.id},
            headers={"Authorization": f"Token {token}"},
        )

        # Only same-exchange users can verify
        if token == self.users["PIXL001"]:
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
                "government_id": "",
                "date_of_birth": "1991-12-21",
                "exchange": "1",
                "image": sample_image(),
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user_sufail = User.objects.get(username="KKDE005")

        # Login should fail (not verified)
        response = self.client.post(
            f"{BASE_URL}login/",
            {"username": "KKDE005", "password": "dummypassword"},
        )
        self.assertFalse(response.json()["is_active"])

        # Wrong exchange verification attempt
        self.verify_sufail(self.users["PIXL001"])
        user_sufail.refresh_from_db()
        self.assertFalse(user_sufail.is_active)

        # Correct exchange verification
        self.verify_sufail(self.users["KKDE001"])
        user_sufail.refresh_from_db()
        self.assertTrue(user_sufail.is_active)

        # Login succeeds after verification
        response = self.client.post(
            f"{BASE_URL}login/",
            {"username": "KKDE005", "password": "dummypassword"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

# =====================================================================
# LISTING TESTS
# =====================================================================

class ListingTest(APITestCase):
    fixtures = ["datas.json"]

    def setUp(self):
        self.listing_id = 1
        self.url = f"{BASE_URL}listings/{self.listing_id}/"

        self.listing_exists = lambda: Listing.objects.filter(id=self.listing_id).exists()
        self.listing_active = lambda: Listing.objects.filter(
            id=self.listing_id, is_active=True
        ).exists()

        self.users = {
            "KKDE001": Token.objects.get_or_create(user_id=1)[0],
            "KKDE002": Token.objects.get_or_create(user_id=2)[0],
        }

    def test_list_listings(self):
        """
        Listings visibility based on ownership
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.users["KKDE001"].key)

        response = self.client.get(f"{BASE_URL}listings/?type=O&page=1&user=2")
        self.assertEqual(response.json()["results"], [])

        response = self.client.get(f"{BASE_URL}listings/?type=O&page=1&user=1")
        self.assertEqual(response.json()["results"][0]["title"], "rice")

    def test_view_listing(self):
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.users["KKDE001"].key)
        response = self.client.get(self.url)
        self.assertEqual(response.json()["title"], "rice")

    def test_owner_can_delete(self):
        self.assertTrue(self.listing_exists())
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.users["KKDE001"].key)

        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(self.listing_exists())

    def test_other_user_cannot_delete(self):
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.users["KKDE002"].key)

        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(self.listing_exists())

    def test_owner_can_deactivate(self):
        """
        Owner can deactivate listing; others cannot see it
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.users["KKDE001"].key)

        response = self.client.patch(self.url, data={"is_active": False})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(self.listing_active())

        # Owner can still see inactive listing
        response = self.client.get(f"{BASE_URL}listings/?type=O&user=1")
        self.assertEqual(response.json()["results"][0]["title"], "rice")

        # Other users cannot
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.users["KKDE002"].key)
        response = self.client.get(f"{BASE_URL}listings/?type=O&user=1")
        self.assertEqual(response.json()["results"], [])

# =====================================================================
# TRANSACTIONS
# =====================================================================

class TransactionTest(APITestCase):
    fixtures = ["datas.json"]

    def setUp(self):
        self.user_nusra = User.objects.get(username="KKDE002")
        self.user_sulaiman = User.objects.get(username="KKDE003")

    def test_get_transactions(self):
        """
        Transaction visibility rules
        """
        token = Token.objects.get_or_create(user_id=5)[0]
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key)

        response = self.client.get(f"{BASE_URL}transactions/?user=2")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.get(f"{BASE_URL}transactions/?user=8")
        self.assertEqual(response.json()[0]["description"], "Sandwich ")

        response = self.client.get(f"{BASE_URL}transactions/?user=6")
        self.assertEqual(response.json(), [])

    def test_login_and_make_transaction(self):
        """
        Seller → buyer transaction & balance update
        """
        response = self.client.post(
            f"{BASE_URL}login/",
            {"username": "KKDE003", "password": "sumee1910"},
        )
        token = response.json()["key"]

        response = self.client.post(
            f"{BASE_URL}transactions/",
            {
                "user": self.user_nusra.id,
                "amount": 10,
                "message": "caring",
            },
            headers={"Authorization": f"Token {token}"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # check sulaiman has 10$ balance
        response = self.client.get(
            f"{BASE_URL}ajax/?purpose=userbalance", headers={"Authorization": f"Token {token}"}
        )
        self.assertEqual(response.json()['data'], -10)

        # login as nusra. check she has -10$ balance
        response = self.client.post(
            f"{BASE_URL}login/",
            {"username": "KKDE002", "password": "sumee1910"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["username"], "KKDE002")
        response = self.client.get(
            f"{BASE_URL}ajax/?purpose=userbalance",
            headers={"Authorization": f"Token {response.json()['key']}"},
        )
        self.assertEqual(response.json()['data'], 10)
    

    def test_txn_amt(self):
        """
        Invalid transaction amounts should fail
        """
        token = Token.objects.get_or_create(user_id=5)[0]

        for amt in ["0", "0.1", "-10", "0.9", "abcd", "1,3"]:
            response = self.client.post(
                f"{BASE_URL}transactions/",
                {
                    "user": User.objects.get(username="PIXL001").id,
                    "amount": amt,
                    "message": f"sending amount of {{amt}} to sabreesh must return error",
                },
                headers={"Authorization": f"Token {token.key}"},
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            # print(response.json())

    def test_buyer_transaction(self):
        # test buyer transaction
        # check sulaiman has -13$ balance
        pass
    
    def test_send_transactions_only_to_own_exchange(self):
        # sulaiman is kolakkode exchange user, 
        # so must not able to send to sabareesh
        response = self.client.post(
            f"{BASE_URL}login/",
            {"username": "KKDE003", "password": "sumee1910"},
            format="json",
        )
        token = response.json()["key"]
        response = self.client.post(
            f"{BASE_URL}transactions/",
            {
                "user": User.objects.get(username="PIXL001").id,
                "amount": '101',
                "message": "sending amount of 101 to sabreesh must return error",
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
            {"username": "KKDE003", "password": "sumee1910"},
            format="json",
        )
        token = response.json()["key"]
        response = self.client.post(
            f"{BASE_URL}transactions/",
            {
                "user": self.user_nusra.id,
                "amount": '101',
                "message": "sending amount of 101 to nusra must return error",
            },
            headers={"Authorization": f"Token {token}"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_min_balance(self):
        # nusra has -990$, so nusra can only send max 10$
        self.user_nusra.balance=settings.MINIMUM_BALANCE+10
        self.user_nusra.save()

        # send 11$ to sulaiman
        response = self.client.post(
            f"{BASE_URL}login/",
            {"username": "KKDE002", "password": "sumee1910"},
            format="json",
        )
        token = response.json()["key"]
        response = self.client.post(
            f"{BASE_URL}transactions/",
            {
                "user": self.user_sulaiman.id,
                "amount": 11,
                "message": "send 11$ to sulaiman must return error",
            },
            headers={"Authorization": f"Token {token}"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

