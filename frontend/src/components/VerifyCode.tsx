import { useState } from 'react';
import { buildPath } from './Path';

function VerifyCode() {
  const [message, setMessage] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function verifyAccount(event: any): Promise<void> {
    event.preventDefault();

    if (!identifier.trim() || !verificationCode.trim()) {
      setMessage('Please enter both your email/username and verification code');
      return;
    }

    setIsLoading(true);
    setMessage('');

    var obj = {
      identifier: identifier.trim(),
      verificationCode: verificationCode.trim()
    };
    var js = JSON.stringify(obj);

    try {
      const response = await fetch(buildPath('api/verify'), {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' }
      });
      
      var res = JSON.parse(await response.text());
      
      if (res.error && res.error.length > 0) {
        setMessage('Verification failed: ' + res.error);
      } else if (res.message) {
        setMessage(res.message);
        if (res.message.includes('successfully')) {
          // Redirect to login after 3 seconds
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
        }
      } else {
        setMessage('Account verified successfully! You can now log in.');
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    } catch (error: any) {
      setMessage('Verification failed: ' + error.toString());
    } finally {
      setIsLoading(false);
    }
  }

  async function resendCode(): Promise<void> {
    if (!identifier.trim()) {
      setMessage('Please enter your email or username first');
      return;
    }

    setIsLoading(true);
    
    var obj = { identifier: identifier.trim() };
    var js = JSON.stringify(obj);

    try {
      const response = await fetch(buildPath('api/resendverification'), {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' }
      });
      
      var res = JSON.parse(await response.text());
      
      if (res.error && res.error.length > 0) {
        setMessage('Failed to resend code: ' + res.error);
      } else if (res.message) {
        setMessage(res.message);
      } else {
        setMessage('Verification code resent! Please check your email.');
      }
    } catch (error: any) {
      setMessage('Failed to resend code: ' + error.toString());
    } finally {
      setIsLoading(false);
    }
  }

  function handleSetIdentifier(e: any): void {
    setIdentifier(e.target.value);
  }

  function handleSetCode(e: any): void {
    setVerificationCode(e.target.value);
  }

  return (
    <div id="verifyCodeDiv">
      <span id="inner-title">VERIFY YOUR ACCOUNT</span><br />
      
      <p style={{ color: '#ccc', fontSize: '14px', margin: '20px 0' }}>
        Enter the 6-character verification code sent to your email.
      </p>
      
      Email or Username: <input 
        type="text" 
        id="verifyIdentifier" 
        placeholder="Email or Username" 
        value={identifier}
        onChange={handleSetIdentifier}
        disabled={isLoading}
      /><br />
      
      Verification Code: <input 
        type="text" 
        id="verificationCode" 
        placeholder="6-character code from email" 
        value={verificationCode}
        onChange={handleSetCode}
        maxLength={6}
        disabled={isLoading}
        style={{ textTransform: 'uppercase' }}
      /><br />
      
      <input 
        type="submit" 
        id="verifyButton" 
        className="buttons" 
        value={isLoading ? "Verifying..." : "Verify Account"}
        onClick={verifyAccount}
        disabled={isLoading}
      />
      
      <br />
      
      <button 
        type="button" 
        id="resendCodeButton" 
        className="buttons"
        onClick={resendCode}
        disabled={isLoading}
        style={{ 
          backgroundColor: '#666', 
          marginTop: '10px',
          fontSize: '14px',
          padding: '8px 16px'
        }}
      >
        {isLoading ? "Sending..." : "Resend Code"}
      </button>
      
      {isLoading && (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      )}
      
      <span id="verifyResult">{message}</span>
      
      <br /><br />
      <span style={{fontSize: '14px'}}>
        Already verified? 
        <a href="/" style={{color: '#646cff', marginLeft: '5px'}}>
          Back to Login
        </a>
      </span>
    </div>
  );
}

export default VerifyCode;