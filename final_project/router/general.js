const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


public_users.post("/register", (req,res) => {
  // Register a new user: expect `username` and `password` in request body
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Check if username already exists in users array
    const userExists = users.some(u => u.username === username);
    if (userExists) {
      return res.status(409).json({ message: 'User already exists!' });
    }

    // Add new user
    users.push({ username, password });
    return res.status(201).json({ message: 'User successfully registered' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to register user' });
  }
});

// Get the book list using Promise callbacks with Axios
public_users.get('/books-promise', (req, res) => {
  // This route demonstrates fetching books using Promise callbacks (.then()/.catch())
  axios.get('http://localhost:5000/')
    .then((response) => {
      // Parse the response if it's a string
      const booksData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      return res.status(200).json({ message: 'Books fetched successfully using Promise callbacks', books: booksData });
    })
    .catch((err) => {
      return res.status(500).json({ error: 'Failed to fetch books using Promise', details: err.message });
    });
});

// Get the book list available in the shop using async-await with Axios
public_users.get('/books-async', async (req, res) => {
  // This route demonstrates fetching books using async-await with Axios
  // It makes a GET request to the same server's root endpoint to fetch all books
  try {
    const response = await axios.get('http://localhost:5000/');
    // Parse the response (the / route returns pretty-printed JSON as string)
    const booksData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
    return res.status(200).json({ message: 'Books fetched successfully using Axios', books: booksData });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch books using Axios', details: err.message });
  }
});

// Get the book list available in the shop
public_users.get('/',function (req, res) {
  // Return the full books object as a nicely formatted JSON string
  // Use JSON.stringify with indentation for neat display
  try {
    const pretty = JSON.stringify(books, null, 4);
    return res.status(200).send(pretty);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve books' });
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn',function (req, res) {
  // Retrieve ISBN from request params and return the matching book
  try {
    const isbn = req.params.isbn;
    const book = books[isbn];
    if (book) {
      const pretty = JSON.stringify(book, null, 4);
      return res.status(200).send(pretty);
    } else {
      return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve book by ISBN' });
  }
 });

// Get book details based on ISBN using async-await with Axios
public_users.get('/isbn-async/:isbn', async function (req, res) {
  try {
    const isbn = req.params.isbn;
    if (!isbn) {
      return res.status(400).json({ message: 'ISBN parameter is required' });
    }

    const response = await axios.get(`http://localhost:5000/isbn/${encodeURIComponent(isbn)}`);
    // /isbn returns pretty JSON string via res.send, so parse if necessary
    const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
    return res.status(200).json({ message: 'Book fetched using async-await', book: data });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ message: `Book with ISBN ${req.params.isbn} not found` });
    }
    return res.status(500).json({ error: 'Failed to fetch book using async-await', details: err.message });
  }
});

// Get book details based on ISBN using Promise callbacks with Axios
public_users.get('/isbn-promise/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  if (!isbn) {
    return res.status(400).json({ message: 'ISBN parameter is required' });
  }

  axios.get(`http://localhost:5000/isbn/${encodeURIComponent(isbn)}`)
    .then(response => {
      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      return res.status(200).json({ message: 'Book fetched using Promise callbacks', book: data });
    })
    .catch(err => {
      if (err.response && err.response.status === 404) {
        return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
      }
      return res.status(500).json({ error: 'Failed to fetch book using Promise callbacks', details: err.message });
    });
});
  
// Get book details based on author
public_users.get('/author/:author',function (req, res) {
  // Retrieve author from request params and return matching books
  try {
    const authorParam = req.params.author;
    if (!authorParam) {
      return res.status(400).json({ message: 'Author parameter is required' });
    }

    const keys = Object.keys(books);
    const matches = {};
    const search = authorParam.toLowerCase();

    for (let k of keys) {
      const b = books[k];
      if (b && b.author && b.author.toLowerCase().includes(search)) {
        matches[k] = b;
      }
    }

    if (Object.keys(matches).length > 0) {
      const pretty = JSON.stringify(matches, null, 4);
      return res.status(200).send(pretty);
    } else {
      return res.status(404).json({ message: `No books found for author '${authorParam}'` });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve books by author' });
  }
});

// Get book details based on author using async-await with Axios
public_users.get('/author-async/:author', async (req, res) => {
  try {
    const author = req.params.author;
    if (!author) {
      return res.status(400).json({ message: 'Author parameter is required' });
    }

    const response = await axios.get(`http://localhost:5000/author/${encodeURIComponent(author)}`);
    const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
    return res.status(200).json({ message: 'Books fetched by author using async-await', books: data });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ message: `No books found for author '${req.params.author}'` });
    }
    return res.status(500).json({ error: 'Failed to fetch books by author using async-await', details: err.message });
  }
});

// Get book details based on author using Promise callbacks with Axios
public_users.get('/author-promise/:author', (req, res) => {
  const author = req.params.author;
  if (!author) {
    return res.status(400).json({ message: 'Author parameter is required' });
  }

  axios.get(`http://localhost:5000/author/${encodeURIComponent(author)}`)
    .then(response => {
      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      return res.status(200).json({ message: 'Books fetched by author using Promise callbacks', books: data });
    })
    .catch(err => {
      if (err.response && err.response.status === 404) {
        return res.status(404).json({ message: `No books found for author '${author}'` });
      }
      return res.status(500).json({ error: 'Failed to fetch books by author using Promise callbacks', details: err.message });
    });
});

// Get all books based on title
public_users.get('/title/:title',function (req, res) {
  // Retrieve title from request params and return matching books
  try {
    const titleParam = req.params.title;
    if (!titleParam) {
      return res.status(400).json({ message: 'Title parameter is required' });
    }

    const keys = Object.keys(books);
    const matches = {};
    const search = titleParam.toLowerCase();

    for (let k of keys) {
      const b = books[k];
      if (b && b.title && b.title.toLowerCase().includes(search)) {
        matches[k] = b;
      }
    }

    if (Object.keys(matches).length > 0) {
      const pretty = JSON.stringify(matches, null, 4);
      return res.status(200).send(pretty);
    } else {
      return res.status(404).json({ message: `No books found with title '${titleParam}'` });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve books by title' });
  }
});

// Get book details based on title using async-await with Axios
public_users.get('/title-async/:title', async (req, res) => {
  try {
    const title = req.params.title;
    if (!title) {
      return res.status(400).json({ message: 'Title parameter is required' });
    }

    const response = await axios.get(`http://localhost:5000/title/${encodeURIComponent(title)}`);
    const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
    return res.status(200).json({ message: 'Books fetched by title using async-await', books: data });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ message: `No books found with title '${req.params.title}'` });
    }
    return res.status(500).json({ error: 'Failed to fetch books by title using async-await', details: err.message });
  }
});

// Get book details based on title using Promise callbacks with Axios
public_users.get('/title-promise/:title', (req, res) => {
  const title = req.params.title;
  if (!title) {
    return res.status(400).json({ message: 'Title parameter is required' });
  }

  axios.get(`http://localhost:5000/title/${encodeURIComponent(title)}`)
    .then(response => {
      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      return res.status(200).json({ message: 'Books fetched by title using Promise callbacks', books: data });
    })
    .catch(err => {
      if (err.response && err.response.status === 404) {
        return res.status(404).json({ message: `No books found with title '${title}'` });
      }
      return res.status(500).json({ error: 'Failed to fetch books by title using Promise callbacks', details: err.message });
    });
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  // Retrieve ISBN from params and return the reviews for that book
  try {
    const isbn = req.params.isbn;
    if (!isbn) {
      return res.status(400).json({ message: 'ISBN parameter is required' });
    }

    const book = books[isbn];
    if (!book) {
      return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
    }

    const reviews = book.reviews || {};
    const pretty = JSON.stringify(reviews, null, 4);
    return res.status(200).send(pretty);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve reviews' });
  }
});

module.exports.general = public_users;