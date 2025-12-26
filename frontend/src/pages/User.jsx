import { useParams } from 'react-router';
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import API from '../utils/api';

export default function User() {
  const params = useParams();
  const navigate = useNavigate();
  const userid = params['id'];

  const [user, setUser] = useState({});
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getUser();
  }, []);
  const getUser = async () => {
    try {
      const response = await API.get(`/users/${userid}/`);
      setUser(response.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };
  const handleSendMoney = async () => {
      setError("");  // Clear previous errors
      setLoading(true);
      try {
        const response = await API.post('/transactions/',{
          user: userid,
          amount: amount,
          message: message
        });
        navigate("/dashboard/");
        // setModalVisible(false); 
        // router.replace({ pathname: 'screens/sendmoney/success',params: {name:first_name, amount:amount } });
        // setOffering(response.data);
      } catch (error) {
        if (error.response) {
          setError(JSON.stringify(error.response.data)|| "Invalid credentials");
        } else if (error.request) {
          setError("Network error. Please try again.");
        } else {
          setError("Something went wrong. Please try again.");
        }      
      } finally {
        setLoading(false);      
      }    
    };
  return (
  <div>
    {loading==true ? (<div>loading...</div>): (
    <div className='row'>
      <div className='col-12 col-md-4'>
        <div className="card"> {/* style={{ width: '18rem'}}>*/}
          
          <div className='card-header'><h5 className="card-title">{user.first_name} ({user.username})</h5></div>
          <ul class="list-group list-group-flush">
            <li class="list-group-item"><img src={user.image} className="card-img-top" alt={user.first_name} /></li>
            <li class="list-group-item"><p className="card-text">balance: £ {user.balance ?? 0}</p></li>
          </ul>

          <div className="card-body">
            {/* <input
              className="form-control mb-4"
              placeholder="Enter message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            /> */}
            <input
              type="number"
              className="form-control form-control-lg text-center mb-4"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {error}
            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
              {/* <button class="btn btn-secondary me-md-2" type="button" onClick={() => navigate("/dashboard/")}>Go Back</button> */}
              <button class="btn btn-primary btn-lg" type="button" onClick={handleSendMoney}>Pay</button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
    
    )}      
  </div>
  )
}