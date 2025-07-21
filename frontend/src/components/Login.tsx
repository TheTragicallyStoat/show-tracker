import { useState } from 'react';
import { buildPath } from './Path';

function Login()
{
  const [message,setMessage] = useState('');
  const [loginName,setLoginName] = useState('');
  const [loginPassword,setPassword] = useState('');

    async function doLogin(event:any) : Promise<void>
    {
        event.preventDefault();

        var obj = {login:loginName,password:loginPassword};
        var js = JSON.stringify(obj);
  
        try
        {    
            const response = await fetch(buildPath('api/login'),
{method:'POST',body:js,headers:{'Content-Type':
'application/json'}});
            var res = JSON.parse(await response.text());
  
            if( res.id <= 0 )
            {
                setMessage('User/Password combination incorrect');
            }
            else if (!res.isVerified)
            {
                setMessage('Account not verified. Please check your email for the verification code.');
            }
            else
            {
                var user = {firstName:res.firstName,lastName:res.lastName,id:res.id}
                localStorage.setItem('user_data', JSON.stringify(user));
  
                setMessage('');
                window.location.href = '/shows';
            }
        }
        catch(error:any)
        {
            alert(error.toString());
            return;
        }    
      }

    function handleSetLoginName( e: any ) : void
    {
      setLoginName( e.target.value );
    }

    function handleSetPassword( e: any ) : void
    {
      setPassword( e.target.value );
    }

    return(
      <div id="loginDiv">
        <span id="inner-title">PLEASE LOG IN</span><br />
        Login: <input type="text" id="loginName" placeholder="Username" 
          onChange={handleSetLoginName} /><br />
        Password: <input type="password" id="loginPassword" placeholder="Password" 
          onChange={handleSetPassword} />
        <input type="submit" id="loginButton" className="buttons" value = "Sign in"
          onClick={doLogin} />
        <span id="loginResult">{message}</span>
        
        {/* Show forgot password link when login fails */}
        {message.includes('incorrect') && (
          <div style={{marginTop: '15px', padding: '10px', backgroundColor: '#2a2a2a', borderRadius: '4px'}}>
            <span style={{fontSize: '14px', color: '#ccc'}}>
              Forgot your password? 
              <a href="/forgot-password" style={{color: '#646cff', marginLeft: '5px', fontWeight: 'bold'}}>
                Reset it here
              </a>
            </span>
          </div>
        )}
        
        {/* Show verify account link when account not verified */}
        {message.includes('not verified') && (
          <div style={{marginTop: '15px', padding: '10px', backgroundColor: '#2a2a2a', borderRadius: '4px'}}>
            <span style={{fontSize: '14px', color: '#ccc'}}>
              Account not verified? 
              <a href="/verify-code" style={{color: '#646cff', marginLeft: '5px', fontWeight: 'bold'}}>
                Verify it here
              </a>
            </span>
          </div>
        )}
        
        <br /><br />
        <span style={{fontSize: '14px'}}>
          Don't have an account? 
          <a href="/register" style={{color: '#646cff', marginLeft: '5px'}}>
            Create one here
          </a>
        </span>
     </div>
    );
};

export default Login;
