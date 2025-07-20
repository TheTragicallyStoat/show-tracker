import { useState } from 'react';
import { buildPath } from './Path';

function Register() {
  const [message, setMessage] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function doRegister(event: any): Promise<void> {
    event.preventDefault();

    // Basic validation
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !loginName.trim() || !password.trim()) {
      setMessage('All fields are required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setMessage('Please enter a valid email address');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    var obj = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      login: loginName.trim(),
      password: password
    };
    var js = JSON.stringify(obj);

    try {
      const response = await fetch(buildPath('api/register'), {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' }
      });

      var res = JSON.parse(await response.text());

      if (res.error && res.error.length > 0) {
        setMessage('Registration failed: ' + res.error);
      } else {
        setMessage('Registration successful! You can now log in.');
        // Clear form
        setFirstName('');
        setLastName('');
        setEmail('');
        setLoginName('');
        setPassword('');
        setConfirmPassword('');
        
        // Optional: redirect to login after successful registration
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    } catch (error: any) {
      setMessage('Connection error: ' + error.toString());
    }
  }

  function handleSetFirstName(e: any): void {
    setFirstName(e.target.value);
  }

  function handleSetLastName(e: any): void {
    setLastName(e.target.value);
  }

  function handleSetEmail(e: any): void {
    setEmail(e.target.value);
  }

  function handleSetLoginName(e: any): void {
    setLoginName(e.target.value);
  }

  function handleSetPassword(e: any): void {
    setPassword(e.target.value);
  }

  function handleSetConfirmPassword(e: any): void {
    setConfirmPassword(e.target.value);
  }

  return (
    <div id="registerDiv">
      <span id="inner-title">CREATE ACCOUNT</span><br />
      
      First Name: <input 
        type="text" 
        id="firstName" 
        placeholder="First Name" 
        value={firstName}
        onChange={handleSetFirstName} 
      /><br />
      
      Last Name: <input 
        type="text" 
        id="lastName" 
        placeholder="Last Name" 
        value={lastName}
        onChange={handleSetLastName} 
      /><br />
      
      Email: <input 
        type="email" 
        id="email" 
        placeholder="Email Address" 
        value={email}
        onChange={handleSetEmail} 
      /><br />
      
      Username: <input 
        type="text" 
        id="registerLoginName" 
        placeholder="Username" 
        value={loginName}
        onChange={handleSetLoginName} 
      /><br />
      
      Password: <input 
        type="password" 
        id="registerPassword" 
        placeholder="Password (min 6 characters)" 
        value={password}
        onChange={handleSetPassword} 
      /><br />
      
      Confirm Password: <input 
        type="password" 
        id="confirmPassword" 
        placeholder="Confirm Password" 
        value={confirmPassword}
        onChange={handleSetConfirmPassword} 
      /><br />
      
      <input 
        type="submit" 
        id="registerButton" 
        className="buttons" 
        value="Create Account"
        onClick={doRegister} 
      />
      
      <span id="registerResult">{message}</span>
      
      <br /><br />
      <span style={{fontSize: '14px'}}>
        Already have an account? 
        <a href="/" style={{color: '#646cff', marginLeft: '5px'}}>
          Sign in here
        </a>
      </span>
    </div>
  );
}

export default Register;
