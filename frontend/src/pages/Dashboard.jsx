import { useState, useEffect } from 'react';
import {Link} from "react-router-dom";
import API from '../utils/api';

export default function Dashboard() {
  const [balance, setBalance] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authuser, setAuthUser] = useState({});
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  useEffect(() => {
    getAuthUser();
    fetchBalance();
  }, []);

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const getAuthUser = () => {
      const user = localStorage.getItem('user');
      setAuthUser(user ? JSON.parse(user) : null);
    };
  const fetchUsers = async (pageNumber) => {
    setLoading(true);
    try {
      const res = await API.get(`/users/?page=${pageNumber}`);
      setUsers(res.data.results);
      setHasNext(res.data.next);
      setHasPrevious(res.data.previous);
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

      <div style={{ marginTop: 20 }}>
        <button className="btn btn-primary" onClick={() => setPage(p => p - 1)} disabled={!hasPrevious}>
          {'<-- Previous Page'}
        </button>
        <button className="btn btn-primary" onClick={() => setPage(p => p + 1)} disabled={!hasNext} style={{ marginLeft: 10 }}>
          {'Next Page -->'}
        </button>
      </div>   
    </>
  );
}
