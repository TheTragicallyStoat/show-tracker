import React, { useState, useEffect } from 'react';
import { buildPath } from './Path';
import { retrieveToken, storeToken } from '../tokenStorage';

function ShowUI() {
  const [message, setMessage] = useState('');
  const [searchResults, setResults] = useState('');
  const [showList, setShowList] = useState('');
  const [search, setSearchValue] = useState('');
  const [rating, setRatingValue] = useState<'Not Watched Yet' | number>('Not Watched Yet');
  const [genre, setGenreValue] = useState('');
  const [genreFilter, setGenreFilter] = useState('');

  const [userShows, setUserShows] = useState<any[]>([]);
  const [selectedShowIndex, setSelectedShowIndex] = useState<number | null>(null);
  const [messageDelete, setMessageDelete] = useState('');
  const [showName, setShowNameValue] = useState('');

  const genres = [
    'Action', 'Comedy', 'Drama', 'Sci-Fi', 'Horror',
    'Fantasy', 'Romance', 'Thriller', 'Documentary'
  ];

  const ratingOptions = [
    'Not Watched Yet',
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
  ];

  const userId = JSON.parse(String(localStorage.getItem('user_data'))).id;

  useEffect(() => {
    loadUserShows();
  }, []);

  async function loadUserShows() {
    const obj = { userId, search: '', genreFilter: '', jwtToken: retrieveToken() };
    try {
      const response = await fetch(buildPath('api/searchshows'), {
        method: 'POST',
        body: JSON.stringify(obj),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await response.json();
      if (!res.error) {
        setUserShows(res.results);
        storeToken(res.jwtToken);
      }
    } catch (e) {
      console.error('Failed to load user shows:', e);
    }
  }

  function handleSearchTextChange(e: any) {
    setSearchValue(e.target.value);
  }

  function handleGenreFilterChange(e: any) {
    setGenreFilter(e.target.value);
  }

  function handleShowSelectChange(e: any) {
    const idx = e.target.value === '' ? null : Number(e.target.value);
    setSelectedShowIndex(idx);
    if (idx !== null) {
      const s = userShows[idx];
      setShowNameValue(s.show);
      setRatingValue(s.rating);
      setGenreValue(s.genre);
    } else {
      setShowNameValue('');
      setRatingValue('Not Watched Yet');
      setGenreValue('');
    }
  }

  function handleShowNameChange(e: any) {
    setShowNameValue(e.target.value);
  }

  function handleRatingChange(e: any) {
    const val = e.target.value;
    if (val === 'Not Watched Yet') {
      setRatingValue(val);
    } else {
      setRatingValue(Number(val));
    }
  }

  function handleGenreChange(e: any) {
    setGenreValue(e.target.value);
  }

  async function searchShow(e: any) {
    e.preventDefault();

    const obj = { userId, search, genreFilter, jwtToken: retrieveToken() };

    try {
      const response = await fetch(buildPath('api/searchshows'), {
        method: 'POST',
        body: JSON.stringify(obj),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await response.json();

      const resultText = res.results
        .map((item: any) => `${item.show} (Rating: ${item.rating}, Genre: ${item.genre})`)
        .join(', ');

      setResults('Show(s) have been retrieved');
      setShowList(resultText);
      storeToken(res.jwtToken);
      setTimeout(() => setResults(''), 3000);
    } catch (error: any) {
      setResults(error.toString());
    }
  }

  async function addShow(e: any) {
    e.preventDefault();

    if (!showName || !genre) {
      setMessage('Please enter a show name and select a genre.');
      return;
    }

    if (
      rating !== 'Not Watched Yet' &&
      (typeof rating !== 'number' || rating < 0 || rating > 10)
    ) {
      setMessage('Please enter a valid rating between 0 and 10 or select "Not Watched Yet".');
      return;
    }

    const obj = { userId, show: showName, rating, genre, jwtToken: retrieveToken() };

    try {
      const response = await fetch(buildPath('api/addshow'), {
        method: 'POST',
        body: JSON.stringify(obj),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await response.json();

      if (res.error.length > 0) {
        setMessage('API Error: ' + res.error);
      } else {
        setMessage('Show has been added successfully!');
        storeToken(res.jwtToken);
        loadUserShows();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error: any) {
      setMessage(error.toString());
    }
  }

  async function updateShow(e: any) {
    e.preventDefault();
    if (selectedShowIndex === null) {
      setMessage('Please select a show to update.');
      return;
    }
    if (!showName || !genre) {
      setMessage('Show name and genre are required.');
      return;
    }

    const obj = {
      userId,
      oldShowName: userShows[selectedShowIndex].show,
      newShowName: showName,
      rating,
      genre,
      jwtToken: retrieveToken(),
    };

    try {
      const response = await fetch(buildPath('api/updateshow'), {
        method: 'POST',
        body: JSON.stringify(obj),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await response.json();

      if (res.error.length > 0) {
        setMessage('API Error: ' + res.error);
      } else {
        setMessage('Show has been updated!');
        storeToken(res.jwtToken);
        loadUserShows();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error: any) {
      setMessage(error.toString());
    }
  }

  async function deleteShow(e: any) {
    e.preventDefault();

    if (selectedShowIndex === null) {
      setMessageDelete('Please select a show to delete.');
      setTimeout(() => setMessageDelete(''), 3000);
      return;
    }
    const showToDelete = userShows[selectedShowIndex].show;

    const obj = { userId, show: showToDelete, jwtToken: retrieveToken() };

    try {
      const response = await fetch(buildPath('api/deleteshow'), {
        method: 'POST',
        body: JSON.stringify(obj),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await response.json();
      setMessageDelete(res.error);
      setTimeout(() => setMessageDelete(''), 3000);

      if (!res.error || res.error === 'Successfully Deleted') {
        loadUserShows();
        setSelectedShowIndex(null);
        setShowNameValue('');
        setRatingValue('Not Watched Yet');
        setGenreValue('');
      }
    } catch (error: any) {
      setMessageDelete(error.toString());
      setTimeout(() => setMessageDelete(''), 3000);
    }
  }

  return (
    <div id="showUIDiv">
      <br />
      Search:{' '}
      <input
        type="text"
        id="searchText"
        placeholder="Show To Search For"
        onChange={handleSearchTextChange}
        value={search}
      />
      <select
        id="genreSearchSelect"
        onChange={handleGenreFilterChange}
        value={genreFilter}
        style={{ marginLeft: '10px' }}
      >
        <option value="">All Genres</option>
        {genres.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>
      <button type="button" id="searchShowButton" className="buttons" onClick={searchShow}>
        Search Show
      </button>
      <br />
      <span id="showSearchResult">{searchResults}</span>
      <p id="showList">{showList}</p>

      <br /><br />

      {/* Select show to edit or delete */}
      <label htmlFor="selectUserShow">Select a Show to Edit or Delete:</label>
      <br />
      <select
        id="selectUserShow"
        value={selectedShowIndex !== null ? selectedShowIndex : ''}
        onChange={handleShowSelectChange}
        style={{ minWidth: '300px' }}
      >
        <option value="">-- Select a show --</option>
        {userShows.map((s, i) => (
          <option key={i} value={i}>
            {s.show} (Rating: {s.rating}, Genre: {s.genre})
          </option>
        ))}
      </select>

      <br /><br />

      {/* Edit form */}
      Show Name:{' '}
      <input
        type="text"
        id="showNameInput"
        placeholder="Show Name"
        onChange={handleShowNameChange}
        value={showName}
        style={{ minWidth: '300px' }}
      />
      <br />

      Rating:{' '}
      <select
        id="ratingSelect"
        onChange={handleRatingChange}
        value={rating}
        style={{ width: '150px', marginTop: '5px' }}
      >
        {ratingOptions.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      Genre:{' '}
      <select
        id="genreSelect"
        onChange={handleGenreChange}
        value={genre}
        style={{ marginLeft: '10px', marginTop: '5px' }}
      >
        <option value="">Select Genre</option>
        {genres.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>

      <br /><br />

      <button type="button" className="buttons" onClick={addShow}>
        Add Show
      </button>
      <button type="button" className="buttons" onClick={updateShow} style={{ marginLeft: '10px' }}>
        Update Show
      </button>
      <button type="button" className="buttons" onClick={deleteShow} style={{ marginLeft: '10px' }}>
        Delete Show
      </button>

      <br />
      <span id="showAddResult">{message}</span>
      <br />
      <span id="showDeleteResult" style={{ color: 'red' }}>{messageDelete}</span>
    </div>
  );
}

export default ShowUI;
