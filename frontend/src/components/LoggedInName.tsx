import React, { useState, useEffect } from 'react';

function LoggedInName() {
  const [user, setUser] = useState({ firstName: '', lastName: '' });

  // On mount, read user data from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user_data');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser({ firstName: parsedUser.firstName, lastName: parsedUser.lastName });
    }
  }, []);

  function doLogout(event: React.MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
  localStorage.removeItem('user_data'); // Clear user session
  window.location.href = '/'; // Redirect to login page or root route
}


  return (
    <div id="loggedInDiv">
      <span id="userName">
        Logged In As {user.firstName} {user.lastName}
      </span>
      <br />
      <button type="button" id="logoutButton" className="buttons" onClick={doLogout}>
        Log Out
      </button>
    </div>
  );
}

export default LoggedInName;
