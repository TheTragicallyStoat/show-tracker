import { useState, useEffect } from 'react';
import { buildPath } from './Path';

function VerifyEmail() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Get verification code from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const userEmail = urlParams.get('email');
    
    if (code && userEmail) {
      setEmail(userEmail);
      // Auto-verify if we have both code and email
      verifyEmailWithCode(code, userEmail);
    } else {
      setIsLoading(false);
      setMessage('Invalid verification link. Please check your email for the correct link.');
    }
  }, []);

  async function verifyEmailWithCode(code: string, userEmail: string): Promise<void> {
    setIsLoading(true);
    
    var obj = {
      identifier: userEmail,
      verificationCode: code
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
        setMessage('Email verified successfully! You can now log in.');
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

  async function resendVerification(): Promise<void> {
    if (!email) {
      setMessage('Email address not found. Please try the verification link from your email again.');
      return;
    }

    setIsLoading(true);
    
    var obj = { identifier: email };
    var js = JSON.stringify(obj);

    try {
      const response = await fetch(buildPath('api/resendverification'), {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' }
      });
      
      var res = JSON.parse(await response.text());
      
      if (res.error && res.error.length > 0) {
        setMessage('Failed to resend verification: ' + res.error);
      } else if (res.message) {
        setMessage(res.message);
      } else {
        setMessage('Verification email resent! Please check your email.');
      }
    } catch (error: any) {
      setMessage('Failed to resend verification: ' + error.toString());
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div id="verifyEmailDiv">
      <span id="inner-title">EMAIL VERIFICATION</span><br />
      
      {isLoading ? (
        <div className="loading">
          <p>Verifying your email...</p>
          <div className="spinner"></div>
        </div>
      ) : (
        <div>
          <div id="verificationResult">
            {message}
          </div>
          
          {message.includes('failed') || message.includes('Invalid') ? (
            <div>
              <button 
                type="button" 
                id="resendButton" 
                className="buttons"
                onClick={resendVerification}
                disabled={isLoading}
              >
                Resend Verification Email
              </button>
              <br /><br />
              <a href="/" style={{color: '#646cff'}}>
                Back to Login
              </a>
            </div>
          ) : message.includes('successfully') ? (
            <div>
              <p>Redirecting to login page in 3 seconds...</p>
              <a href="/" style={{color: '#646cff'}}>
                Go to Login Now
              </a>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default VerifyEmail;