const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
//write code to check is the username is valid
return typeof username === 'string' && username.trim().length > 0;
}

const authenticatedUser = (username,password)=>{ //returns boolean
//write code to check if username and password match the one we have in records.
 return users.some(u => u.username === username && u.password === password);
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  //Write your code here
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  if (!isValid(username)) {
    return res.status(400).json({ message: 'Invalid username' });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  // User authenticated — create JWT and save in session
  const accessToken = jwt.sign({ username: username }, 'access', { expiresIn: 60 * 60 });
  req.session.authorization = { accessToken, username };

  return res.status(200).json({ message: 'User successfully logged in', accessToken });
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  //Write your code here
  const review = req.query.review;
  const isbn = req.params.isbn;
  const username = req.session.authorization.username;

  if (!review) {
    return res.status(400).json({ message: 'Review query parameter is required' });
  }

  if (!isbn) {
    return res.status(400).json({ message: 'ISBN is required' });
  }

  // Check if book exists
  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }

  // Add or update review by username
  book.reviews[username] = review;
  return res.status(200).json({ message: 'Review added/updated successfully', review: book.reviews });
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
  // Get ISBN and username from session
  const isbn = req.params.isbn;
  const username = req.session.authorization.username;

  if (!isbn) {
    return res.status(400).json({ message: 'ISBN is required' });
  }

  // Check if book exists
  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }

  // Check if the user has a review for this book
  if (!book.reviews[username]) {
    return res.status(404).json({ message: `No review found from user '${username}' for ISBN ${isbn}` });
  }

  // Delete the review for this user
  delete book.reviews[username];
  return res.status(200).json({ message: 'Review deleted successfully', review: book.reviews });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
