import { useState, useEffect } from 'react';
import {Link} from "react-router-dom";
import API from '../utils/api';

export default function Dashboard() {
  const [balance, setBalance] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authuser, setAuthUser] = useState({});

  useEffect(() => {
    getAuthUser();
    fetchBalance();
    fetchUsers();
    
  }, []);

  const getAuthUser = () => {
      const user = localStorage.getItem('user');
      setAuthUser(user ? JSON.parse(user) : null);
    };
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await API.get(`/users/`);
      console.log(response.data)
      setUsers(response.data);
    } catch (err) {
      if (err.response) {
        console.log(err.response.data || 'Login failed. Please try again.');
      } else if (err.request) {
        alert('No response from server. Check your network.');
      } else {
        alert('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };
  const fetchBalance = async () => {    
    try {
        const response = await API.get('/ajax/?purpose=userbalance');
        setBalance(response.data['data']);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
  };
  const listItems = users.map((user) =>
    <div className="col-3 mb-4" key={user.id}>
      <div className="media">
        <Link to={`/user/${user.id}`}>
          <img className="img-thumbnail mr-3" src={user.thumbnail ? user.thumbnail: ''} 
            alt="" />
        </Link>
        <div className="media-body">
         {/* <Link to={`/user/${user.id}`}>{user.username}</Link><br />
          Balance: <strong>{user.balance}</strong><br /> */}
          {user.first_name}
        </div>
      </div>
    </div>
  );
  return (
    <>
      <h3>{authuser.firstname}, ({authuser.exchange_name})</h3>
      <h2>Your Balance: {balance != null ? `${balance}`:'****'}</h2>
      <hr />
      {loading==true ? (<div>loading...</div>): (<div className="row">{listItems}</div>)}      
    </>
  );
}
