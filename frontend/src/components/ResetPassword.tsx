import { useState } from 'react';
import { buildPath } from './Path';

function ResetPassword() {
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [identifier, setIdentifier] = useState('');

  async function resetPassword(event: any): Promise<void> {
    event.preventDefault();

    // Validation
    if (!identifier.trim() || !resetToken.trim() || !password.trim() || !confirmPassword.trim()) {
      setMessage('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (password.length < 7) {
      setMessage('Password must be at least 7 characters long');
      return;
    }

    // Check for symbol and capital letter (matching backend validation)
    const symbolRegex = /[^A-Za-z0-9]/;
    const capitalRegex = /[A-Z]/;
    if (!symbolRegex.test(password) || !capitalRegex.test(password)) {
      setMessage('Password must contain at least one symbol and one capital letter');
      return;
    }

    setIsLoading(true);
    setMessage('');

    var obj = {
      identifier: identifier.trim(),
      resetToken: resetToken.trim(),
      newPassword: password
    };
    var js = JSON.stringify(obj);

    try {
      const response = await fetch(buildPath('api/resetpassword'), {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' }
      });
      
      var res = JSON.parse(await response.text());
      
      if (res.error && res.error.length > 0) {
        setMessage('Password reset failed: ' + res.error);
      } else if (res.message) {
        setMessage(res.message);
        setPassword('');
        setConfirmPassword('');
        setResetToken('');
        
        if (res.message.includes('successfully')) {
          // Redirect to login after 3 seconds
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
        }
      } else {
        setMessage('Password reset successful! You can now log in with your new password.');
        setPassword('');
        setConfirmPassword('');
        setResetToken('');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    } catch (error: any) {
      setMessage('Password reset failed: ' + error.toString());
    } finally {
      setIsLoading(false);
    }
  }

  function handleSetIdentifier(e: any): void {
    setIdentifier(e.target.value);
  }

  function handleSetResetToken(e: any): void {
    setResetToken(e.target.value);
  }

  function handleSetPassword(e: any): void {
    setPassword(e.target.value);
  }

  function handleSetConfirmPassword(e: any): void {
    setConfirmPassword(e.target.value);
  }

  return (
    <div id="resetPasswordDiv">
      <span id="inner-title">RESET PASSWORD</span><br />
      
      <p style={{ color: '#ccc', fontSize: '14px', margin: '20px 0' }}>
        Enter the 6-character reset code from your email and your new password.
      </p>
      
      Email or Username: <input 
        type="text" 
        id="resetIdentifier" 
        placeholder="Email or Username" 
        value={identifier}
        onChange={handleSetIdentifier}
        disabled={isLoading}
      /><br />
      
      Reset Code: <input 
        type="text" 
        id="resetToken" 
        placeholder="6-character code from email" 
        value={resetToken}
        onChange={handleSetResetToken}
        maxLength={6}
        disabled={isLoading}
        style={{ textTransform: 'uppercase' }}
      /><br />
      
      New Password: <input 
        type="password" 
        id="newPassword" 
        placeholder="New Password (7+ chars, symbol, capital)" 
        value={password}
        onChange={handleSetPassword}
        disabled={isLoading}
      /><br />
      
      Confirm Password: <input 
        type="password" 
        id="confirmNewPassword" 
        placeholder="Confirm New Password" 
        value={confirmPassword}
        onChange={handleSetConfirmPassword}
        disabled={isLoading}
      /><br />
      
      <input 
        type="submit" 
        id="resetPasswordButton" 
        className="buttons" 
        value={isLoading ? "Resetting..." : "Reset Password"}
        onClick={resetPassword}
        disabled={isLoading}
      />
      
      {isLoading && (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      )}
      
      <span id="resetPasswordResult">{message}</span>
      
      {message.includes('successful') && (
        <div>
          <p style={{ color: '#51cf66' }}>Redirecting to login in 3 seconds...</p>
          <a href="/" style={{color: '#646cff'}}>
            Go to Login Now
          </a>
        </div>
      )}
      
      <br /><br />
      <span style={{fontSize: '14px'}}>
        <a href="/" style={{color: '#646cff'}}>
          Back to Login
        </a>
        {' | '}
        <a href="/forgot-password" style={{color: '#646cff'}}>
          Need a reset code?
        </a>
      </span>
    </div>
  );
}

export default ResetPassword;