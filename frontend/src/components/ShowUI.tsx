import { useState } from 'react';
import { buildPath } from './Path';
import { retrieveToken, storeToken } from '../tokenStorage';

function ShowUI() {
  const [message, setMessage] = useState('');
  const [searchResults, setResults] = useState('');
  const [showList, setShowList] = useState<string[]>([]);
  const [search, setSearchValue] = useState('');
  const [show, setShowNameValue] = useState('');

  var _ud = localStorage.getItem('user_data');
  var ud = JSON.parse(String(_ud));
  var userId = ud.id;

  async function addShow(e: any): Promise<void> {
    e.preventDefault();
    var obj = { userId: userId, show: show, jwtToken: retrieveToken() };
    var js = JSON.stringify(obj);
    try {
      const response = await fetch(buildPath('api/addshow'), {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' }
      });
      let txt = await response.text();
      let res = JSON.parse(txt);
      if (res.error.length > 0) {
        setMessage("API Error:" + res.error);
      } else {
        setMessage('Show has been added');
        storeToken(res.jwtToken);
        // Refresh the show list after adding
        searchShow(e);
      }
    } catch (error: any) {
      setMessage(error.toString());
    }
  }

  async function searchShow(e: any): Promise<void> {
    e.preventDefault();
    var obj = { userId: userId, search: search, jwtToken: retrieveToken() };
    var js = JSON.stringify(obj);
    try {
      const response = await fetch(buildPath('api/searchshows'), {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' }
      });
      let txt = await response.text();
      let res = JSON.parse(txt);
      let _results = res.results;
      
      if (_results && _results.length > 0) {
        setResults('Show(s) have been retrieved');
        setShowList(_results);
        storeToken(res.jwtToken);
      } else {
        setResults('No shows found');
        setShowList([]);
      }
    } catch (error: any) {
      alert(error.toString());
      setResults(error.toString());
    }
  }

  async function deleteShow(showName: string): Promise<void> {
    if (!confirm(`Are you sure you want to delete "${showName}"?`)) {
      return;
    }

    var obj = { userId: userId, show: showName, jwtToken: retrieveToken() };
    var js = JSON.stringify(obj);
    try {
      const response = await fetch(buildPath('api/deleteshow'), {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' }
      });
      let txt = await response.text();
      let res = JSON.parse(txt);
      
      if (res.error && res.error.length > 0) {
        setMessage("Delete Error: " + res.error);
      } else {
        setMessage(`"${showName}" has been deleted`);
        storeToken(res.jwtToken);
        // Remove the show from the local list immediately
        setShowList(prevList => prevList.filter(show => show !== showName));
      }
    } catch (error: any) {
      setMessage("Delete failed: " + error.toString());
    }
  }

  function handleSearchTextChange(e: any): void {
    setSearchValue(e.target.value);
  }

  function handleShowTextChange(e: any): void {
    setShowNameValue(e.target.value);
  }

  return (
    <div id="showUIDiv">
      <br />
      Search: <input 
        type="text" 
        id="searchText" 
        placeholder="Show To Search For"
        value={search}
        onChange={handleSearchTextChange} 
      />
      <button 
        type="button" 
        id="searchShowButton" 
        className="buttons"
        onClick={searchShow}
      > 
        Search Show
      </button><br />
      <span id="showSearchResult">{searchResults}</span>
      
      {/* Show List with Delete Buttons */}
      {showList.length > 0 && (
        <div id="showListContainer" style={{ marginTop: '20px', marginBottom: '20px' }}>
          <h4>Your Shows:</h4>
          <div id="showList" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {showList.map((showName, index) => (
              <div 
                key={index} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '10px',
                  backgroundColor: '#1a1a1a',
                  borderRadius: '4px',
                  border: '1px solid #333'
                }}
              >
                <span style={{ color: 'white', fontSize: '14px' }}>{showName}</span>
                <button
                  type="button"
                  onClick={() => deleteShow(showName)}
                  style={{
                    backgroundColor: '#ff4444',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ff6666'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ff4444'}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <br />
      Add: <input 
        type="text" 
        id="cardText" 
        placeholder="Show To Add"
        value={show}
        onChange={handleShowTextChange} 
      />
      <button 
        type="button" 
        id="addCardButton" 
        className="buttons"
        onClick={addShow}
      > 
        Add Show 
      </button><br />
      <span id="showAddResult">{message}</span>
    </div>
  );
}

export default ShowUI;
