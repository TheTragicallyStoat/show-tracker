import { useState } from 'react';
import { buildPath } from './Path';

function ForgotPassword() {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function sendResetEmail(event: any): Promise<void> {
    event.preventDefault();

    if (!email.trim()) {
      setMessage('Please enter your email address');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setMessage('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setMessage('');

    var obj = { identifier: email.trim() };
    var js = JSON.stringify(obj);

    try {
      const response = await fetch(buildPath('api/forgotpassword'), {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' }
      });
      
      var res = JSON.parse(await response.text());
      
      if (res.error && res.error.length > 0) {
        setMessage('Error: ' + res.error);
      } else if (res.message) {
        setMessage(res.message);
        setEmail(''); // Clear the email field
      } else {
        setMessage('Password reset email sent! Please check your email for instructions.');
        setEmail(''); // Clear the email field
      }
    } catch (error: any) {
      setMessage('Failed to send reset email: ' + error.toString());
    } finally {
      setIsLoading(false);
    }
  }

  function handleSetEmail(e: any): void {
    setEmail(e.target.value);
  }

  return (
    <div id="forgotPasswordDiv">
      <span id="inner-title">FORGOT PASSWORD</span><br />
      
      <p style={{ color: '#ccc', fontSize: '14px', margin: '20px 0' }}>
        Enter your email address and we'll send you a link to reset your password.
      </p>
      
      Email: <input 
        type="email" 
        id="forgotEmail" 
        placeholder="Enter your email address" 
        value={email}
        onChange={handleSetEmail}
        disabled={isLoading}
      /><br />
      
      <input 
        type="submit" 
        id="sendResetButton" 
        className="buttons" 
        value={isLoading ? "Sending..." : "Send Reset Email"}
        onClick={sendResetEmail}
        disabled={isLoading}
      />
      
      {isLoading && (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      )}
      
      <span id="forgotPasswordResult">{message}</span>
      
      {/* Show reset password link after email is sent */}
      {message.includes('reset email has been sent') || message.includes('reset code has been sent') && (
        <div style={{marginTop: '15px', padding: '10px', backgroundColor: '#2a2a2a', borderRadius: '4px'}}>
          <span style={{fontSize: '14px', color: '#ccc'}}>
            Got your reset code? 
            <a href="/reset-password" style={{color: '#646cff', marginLeft: '5px', fontWeight: 'bold'}}>
              Enter it here
            </a>
          </span>
        </div>
      )}
      
      <br /><br />
      <span style={{fontSize: '14px'}}>
        Remember your password? 
        <a href="/" style={{color: '#646cff', marginLeft: '5px'}}>
          Back to Login
        </a>
      </span>
      
      <br />
      <span style={{fontSize: '14px'}}>
        Have a reset code already? 
        <a href="/reset-password" style={{color: '#646cff', marginLeft: '5px'}}>
          Reset your password
        </a>
      </span>
    </div>
  );
}

export default ForgotPassword;