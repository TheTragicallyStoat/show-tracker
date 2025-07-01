import React, { useState } from 'react';
import { buildPath } from './Path';
import { retrieveToken, storeToken } from '../tokenStorage';
function ShowUI()
{
const [message,setMessage] = useState('');
const [searchResults,setResults] = useState('');
const [showList,setShowList] = useState('');
const [search,setSearchValue] = React.useState('');
const [show,setShowNameValue] = React.useState('');
var _ud = localStorage.getItem('user_data');
var ud = JSON.parse(String(_ud));
var userId = ud.id;
// var firstName = ud.firstName;
// var lastName = ud.lastName;
async function addShow(e:any) : Promise<void>
{
e.preventDefault();
var obj = {userId:userId,show:show,jwtToken:retrieveToken()};
var js = JSON.stringify(obj);
try
{
const response = await fetch(buildPath('api/addshow'),
{method:'POST',body:js,headers:{'Content-Type': 'application/json'}});
let txt = await response.text();
let res = JSON.parse(txt);
if( res.error.length > 0 )
{
setMessage( "API Error:" + res.error );
}
else
{
setMessage('Show has been added');
storeToken( res.jwtToken );
}
}
catch(error:any)
{
setMessage(error.toString());
}
};
async function searchShow(e:any) : Promise<void>
{
e.preventDefault();
var obj = {userId:userId,search:search,jwtToken:retrieveToken()};
var js = JSON.stringify(obj);
try
{
const response = await fetch(buildPath('api/searchshows'),
{method:'POST',body:js,headers:{'Content-Type': 'application/json'}});
let txt = await response.text();
let res = JSON.parse(txt);
let _results = res.results;
let resultText = '';
for( let i=0; i<_results.length; i++ )
{
resultText += _results[i];
if( i < _results.length - 1 )
{
resultText += ', ';
}
}
setResults('Show(s) have been retrieved');
storeToken( res.jwtToken );
setShowList(resultText);
}
catch(error:any)
{
alert(error.toString());
setResults(error.toString());
}
};
function handleSearchTextChange( e: any ) : void
{
setSearchValue( e.target.value );
}
function handleShowTextChange( e: any ) : void
{
setShowNameValue( e.target.value );
}
return(
<div id="showUIDiv">
<br />
Search: <input type="text" id="searchText" placeholder="Show To Search For"
onChange={handleSearchTextChange} />
<button type="button" id="searchShowButton" className="buttons"
onClick={searchShow}> Search Show</button><br />
<span id="showSearchResult">{searchResults}</span>
<p id="showList">{showList}</p><br /><br />
Add: <input type="text" id="cardText" placeholder="Show To Add"
onChange={handleShowTextChange} />
<button type="button" id="addCardButton" className="buttons"
onClick={addShow}> Add Show </button><br />
<span id="showAddResult">{message}</span>
</div>
);
}
export default ShowUI;