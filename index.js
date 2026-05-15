let allBooks = [];

// ================= LOGIN =================
async function handleLogin() {
  const identifier = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  try {
    const res = await axios.post(
      "https://different-deer-6cff351cfd.strapiapp.com/api/auth/local",
      {
        identifier,
        password,
      },
    );

    localStorage.setItem("token", res.data.jwt);

    localStorage.setItem("user", JSON.stringify(res.data.user));

    // Reload page to update UI
    window.location.href = "profile.html";
  } catch (err) {
    alert("Login failed");
    console.log(err.response?.data);
  }
}

// ================= REGISTER =================
async function handleRegister() {
  const username = document.getElementById("register-username").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;

  console.log(username);
  console.log(email);
  console.log(password);

  try {
    await axios.post(
      "https://different-deer-6cff351cfd.strapiapp.com/api/auth/local/register",
      {
        username,
        email,
        password,
      },
    );

    alert("User created! Now login.");

    document.getElementById("register-username").value = "";
    document.getElementById("register-email").value = "";
    document.getElementById("register-password").value = "";
  } catch (err) {
    alert(err.response?.data?.error?.message || "Register failed");
  }
}

// ===== SHOW / HIDE LOGIN + REGISTER =====

function showLogin() {
  document.getElementById("auth-container").style.display = "flex";
}

function showRegister() {
  document.getElementById("auth-container").style.display = "flex";
}

// ================= CHECK USER =================
async function checkUser() {
  const token = localStorage.getItem("token");

  // No token = not logged in
  if (!token) {
    return;
  }

  try {
    await axios.get(
      "https://different-deer-6cff351cfd.strapiapp.com/api/users/me",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  } catch (err) {
    // Token invalid or expired
    localStorage.removeItem("token");
  }
}

// ================= Load Profile =================

async function loadProfile() {
  const token = localStorage.getItem("token");

  const user = JSON.parse(localStorage.getItem("user"));

  try {
    // Welcome text
    if (user.email === "admin@test.com") {
      document.getElementById("welcome-user").innerText =
        "Welcome Super Admin!";
    } else {
      document.getElementById("welcome-user").innerText =
        `Welcome ${user.username}!`;
    }

    // Get user with saved books
    const res = await axios.get(
      `https://different-deer-6cff351cfd.strapiapp.com/api/users/${user.id}?populate[savedBooks][populate]=cover`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log(res.data);

    const currentUser = res.data;

    // Save & Sort
    const books = currentUser.savedBooks || [];

    const sortValue = document.getElementById("sort-books").value;

    if (sortValue === "title") {
      books.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (sortValue === "author") {
      books.sort((a, b) => a.author.localeCompare(b.author));
    }

    const savedContainer = document.getElementById("saved-books");

    savedContainer.innerHTML = "";

    // ================= RATED BOOKS =================

    const ratedContainer = document.getElementById("rated-books");

    ratedContainer.innerHTML = "";

    const ratingsRes = await axios.get(
      "https://different-deer-6cff351cfd.strapiapp.com/api/ratings?populate[book][populate]=cover",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const allRatings = ratingsRes.data.data;
    console.log(allRatings);

    const ratedSortValue = document.getElementById("sort-rated-books")?.value;

    // REMOVE ratings without books
    const validRatings = allRatings.filter((rating) => rating.book);

    if (ratedSortValue === "title") {
      validRatings.sort((a, b) => a.book.title.localeCompare(b.book.title));
    }

    if (ratedSortValue === "author") {
      validRatings.sort((a, b) => a.book.author.localeCompare(b.book.author));
    }

    if (ratedSortValue === "rating") {
      validRatings.sort((a, b) => b.value - a.value);
    }

    validRatings.forEach((rating) => {
      const book = rating.book;

      if (!book) return;

      const image = book.cover?.[0]?.url
        ? book.cover[0].url
        : "https://placehold.co/300x400?text=No+Image";

      const stars = "⭐".repeat(rating.value);

      const ratedCard = `
  
    <div class="saved-book-card">

      <img 
        src="${image}" 
        class="saved-book-image"
      />

      <div class="saved-book-info">

        <h3>${book.title}</h3>

        <p>${book.author}</p>

        <p>${stars}</p>

        <button 
          class="remove-rating-btn"
          data-id="${rating.documentId}"
        >
          Remove Rating
        </button>

      </div>

    </div>

    <hr class="saved-divider">
  `;

      ratedContainer.innerHTML += ratedCard;
    });

    const removeRatingButtons = document.querySelectorAll(".remove-rating-btn");

    removeRatingButtons.forEach((button) => {
      button.addEventListener("click", () => {
        removeRating(button.dataset.id);
      });
    });

    books.forEach((book) => {
      console.log(book);

      console.log(book.cover);

      const image = book.cover?.[0]?.url
        ? book.cover[0].url
        : "https://placehold.co/300x400?text=No+Image";

      const card = `
        <div class="saved-book-card">

          <img 
            src="${image}" 
            class="saved-book-image"
          />

          <div class="saved-book-info">
            <h3>${book.title}</h3>

            <p>
              <strong>Author:</strong>
              ${book.author}
            </p>

            <p>
              <strong>Pages:</strong>
              ${book.pages || "-"}
            </p>

            <p>
              <strong>Published:</strong>
              ${book.publishedDate || "-"}
            </p>

            <button 
              class="read-btn"
              data-id="${book.id}"
            >
              Read
            </button>

            <button 
              class="remove-btn"
              data-id="${book.id}"
            >
              Remove
            </button>

          </div>

        </div>

        <hr class="saved-divider">
      `;

      savedContainer.innerHTML += card;
    });
    // ================= READ BUTTONS =================

    const readButtons = document.querySelectorAll(".read-btn");

    readButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const bookId = button.dataset.id;

        const selectedBook = books.find((book) => book.id == bookId);

        openModal(selectedBook);
      });
    });

    // ================= REMOVE BUTTONS =================

    const removeButtons = document.querySelectorAll(".remove-btn");

    removeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const bookId = button.dataset.id;

        removeSavedBook(bookId);
      });
    });
  } catch (err) {
    console.log(err);
  }
}

// ================= Log out =================
function logout() {
  localStorage.removeItem("token");

  window.location.href = "login.html";
}

// ================= LOAD BOOKS =================
async function loadBooks() {
  try {
    const res = await axios.get(
      "https://different-deer-6cff351cfd.strapiapp.com/api/books?populate=*",
    );

    const books = res.data.data;
    allBooks = books;

    const booksContainer = document.getElementById("books-container");

    booksContainer.innerHTML = "";

    for (const book of books) {
      console.log(book);

      const image = book.cover?.[0]?.url
        ? book.cover[0].url
        : "https://placehold.co/300x400?text=No+Image";

      const title = book.title || "No title";
      const author = book.author || "Unknown author";
      const pages = book.pages || "-";
      const published = book.publishedDate || "-";

      // LOAD RATINGS FOR THIS BOOK
      const ratingsRes = await axios.get(
        `https://different-deer-6cff351cfd.strapiapp.com/api/ratings?filters[book][id][$eq]=${book.id}&populate=*`,
      );

      const ratings = ratingsRes.data.data;

      let averageRating = "No ratings";

      if (ratings.length > 0) {
        const total = ratings.reduce((sum, rating) => {
          return sum + Number(rating.value);
        }, 0);

        averageRating = (total / ratings.length).toFixed(1);
      }

      const bookCard = `
        <div class="book-card">

          <img 
            src="${image}" 
            alt="${title}"
            class="book-image"
          />

          <div class="book-info">

            <h3>${title}</h3>

            <p>
              <strong>Author:</strong>
              ${author}
            </p>

            <p>
              <strong>Pages:</strong>
              ${pages}
            </p>

            <p>
              <strong>Published:</strong>
              ${published}
            </p>

            <p>
              <strong>Average Rating:</strong>
              ⭐ ${averageRating}
            </p>

            <button 
              class="view-btn"
              data-id="${book.id}"
            >
              View
            </button>

          </div>

        </div>
      `;

      booksContainer.innerHTML += bookCard;
    }

    // VIEW BUTTONS
    const viewButtons = document.querySelectorAll(".view-btn");

    viewButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const token = localStorage.getItem("token");

        if (!token) {
          alert("Please login to view book details.");
          return;
        }

        const bookId = button.dataset.id;

        const selectedBook = books.find((book) => book.id == bookId);

        openModal(selectedBook);
      });
    });
  } catch (err) {
    console.log(err);
  }
}

// ================= OPEN MODAL =================
function openModal(book) {
  const modal = document.getElementById("book-modal");

  // STOP if modal does not exist (profile page)
  if (!modal) return;

  const imageUrl = book.cover?.[0]?.url ? book.cover[0].url : "";

  document.getElementById("modal-image").src = imageUrl;

  document.getElementById("modal-title").innerText = book.title;

  document.getElementById("modal-author").innerText = "Author: " + book.author;

  document.getElementById("modal-pages").innerText =
    "Pages: " + (book.pages || "-");

  document.getElementById("save-btn").dataset.id = book.id;

  document.getElementById("modal-date").innerText =
    "Published: " + book.publishedDate;

  document.getElementById("modal-description").innerText =
    book.description || "No description available.";

  document.getElementById("modal-rating").innerHTML = `
    <button class="star-btn" data-value="1">⭐</button>
    <button class="star-btn" data-value="2">⭐</button>
    <button class="star-btn" data-value="3">⭐</button>
    <button class="star-btn" data-value="4">⭐</button>
    <button class="star-btn" data-value="5">⭐</button>
  `;

  const starButtons = document.querySelectorAll(".star-btn");

  starButtons.forEach((star) => {
    star.addEventListener("click", () => {
      const value = star.dataset.value;

      saveRating(book.id, value);
    });
  });

  // ================= ADMIN DELETE BTN =================

  const user = JSON.parse(localStorage.getItem("user"));

  const isAdmin =
    user?.email === "admin@test.com" ||
    (document.getElementById("admin-panel") &&
      !document.getElementById("admin-panel").classList.contains("hidden"));

  if (isAdmin) {
    document.getElementById("modal-admin-actions").innerHTML = `
      <button
        onclick="deleteBook('${book.documentId}')"
        class="delete-book-btn"
      >
        Delete Book
      </button>
    `;
  } else {
    document.getElementById("modal-admin-actions").innerHTML = "";
  }

  modal.classList.remove("hidden");
}

// ================= SAVE BOOK =================
async function saveBook(event) {
  const token = localStorage.getItem("token");

  const user = JSON.parse(localStorage.getItem("user"));

  const bookId = Number(event.target.dataset.id);

  try {
    // Get current user with books
    const userRes = await axios.get(
      `https://different-deer-6cff351cfd.strapiapp.com/api/users/${user.id}?populate=savedBooks`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    // Existing saved books
    const existingBooks = userRes.data.savedBooks
      ? userRes.data.savedBooks.map((book) => book.id)
      : [];

    // Prevent duplicates
    if (!existingBooks.includes(bookId)) {
      existingBooks.push(bookId);
    }

    // Update user
    await axios.put(
      `https://different-deer-6cff351cfd.strapiapp.com/api/users/${user.id}`,
      {
        savedBooks: existingBooks,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    alert("Book saved to your profile 📚");
  } catch (err) {
    console.log(err);
    alert("Could not save book");
  }
}

// ================= SAVE RATING =================
async function saveRating(bookId, ratingValue) {
  const token = localStorage.getItem("token");

  try {
    const res = await axios.post(
      "https://different-deer-6cff351cfd.strapiapp.com/api/ratings",
      {
        data: {
          value: Number(ratingValue),
          book: bookId,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log(res.data);

    alert("Rating saved ⭐");
  } catch (err) {
    console.log(err);
    console.log(err.response?.data);

    alert("Could not save rating");
  }
}

// ================= CREATE BOOK =================

async function createBook() {
  const token = localStorage.getItem("token");

  try {
    const title = document.getElementById("admin-title").value;

    const author = document.getElementById("admin-author").value;

    const pages = document.getElementById("admin-pages").value;

    const publishedDate = document.getElementById("admin-date").value;

    const description = document.getElementById("admin-description").value;

    const imageFile = document.getElementById("admin-image").files[0];

    // ================= UPLOAD IMAGE =================

    let uploadedImageId = null;

    if (imageFile) {
      const formData = new FormData();

      formData.append("files", imageFile);

      const uploadRes = await axios.post(
        "https://different-deer-6cff351cfd.strapiapp.com/api/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log(uploadRes.data);

      uploadedImageId = uploadRes.data[0].id;
    }

    // ================= CREATE BOOK =================

    await axios.post(
      "https://different-deer-6cff351cfd.strapiapp.com/api/books",
      {
        data: {
          title,
          author,
          pages: Number(pages),
          publishedDate,
          description,
          cover: uploadedImageId,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    alert("Book uploaded 📚");

    document.getElementById("admin-title").value = "";
    document.getElementById("admin-author").value = "";
    document.getElementById("admin-pages").value = "";
    document.getElementById("admin-date").value = "";
    document.getElementById("admin-description").value = "";
    document.getElementById("admin-image").value = "";

    loadBooks();
  } catch (err) {
    console.log(err.response?.data);

    debugger;

    alert("Could not upload book");
  }
}

// ================= DELETE BOOK =================

async function deleteBook(documentId) {
  const token = localStorage.getItem("token");

  const confirmDelete = confirm("Delete this book?");

  if (!confirmDelete) return;

  try {
    await axios.delete(
      `https://different-deer-6cff351cfd.strapiapp.com/api/books/${documentId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    alert("Book deleted 📚");

    document.getElementById("book-modal").classList.add("hidden");

    loadBooks();
  } catch (err) {
    console.log(err.response?.data);

    alert("Could not delete book");
  }
}
// ================= REMOVE RATING =================

async function removeRating(ratingId) {
  const token = localStorage.getItem("token");

  try {
    await axios.delete(
      `https://different-deer-6cff351cfd.strapiapp.com/api/ratings/${ratingId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    alert("Rating removed");

    loadProfile();
  } catch (err) {
    console.log(err.response?.data);

    alert("Could not remove rating");
  }
}
// ================= REMOVE SAVED BOOK =================

async function removeSavedBook(bookId) {
  const token = localStorage.getItem("token");

  const user = JSON.parse(localStorage.getItem("user"));

  try {
    // GET CURRENT USER
    const res = await axios.get(
      `https://different-deer-6cff351cfd.strapiapp.com/api/users/${user.id}?populate=savedBooks`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    // REMOVE BOOK
    const updatedBooks = res.data.savedBooks
      .filter((book) => book.id != bookId)
      .map((book) => book.id);

    // UPDATE USER
    await axios.put(
      `https://different-deer-6cff351cfd.strapiapp.com/api/users/${user.id}`,
      {
        savedBooks: updatedBooks,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    alert("Book removed");

    loadProfile();
  } catch (err) {
    console.log(err);

    alert("Could not remove book");
  }
}

// ================= DOM CONTENT LOADED =================

document.addEventListener("DOMContentLoaded", () => {
  /* sort books */
  const sortBooks = document.getElementById("sort-books");

  if (sortBooks) {
    sortBooks.addEventListener("change", loadProfile);
  }

  const sortRatedBooks = document.getElementById("sort-rated-books");

  if (sortRatedBooks) {
    sortRatedBooks.addEventListener("change", loadProfile);
  }

  // Only run modal code if modal exists
  const closeBtn = document.getElementById("close-modal");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      document.getElementById("book-modal").classList.add("hidden");
    });
  }

  // Homepage only
  if (document.getElementById("books-container")) {
    checkUser();

    loadBooks();
  }

  // Profile page only
  if (document.getElementById("welcome-user")) {
    loadProfile();
  }

  // saved-btn event
  const saveBtn = document.getElementById("save-btn");

  if (saveBtn) {
    saveBtn.addEventListener("click", saveBook);
  }

  // ================= UPLOAD BOOK BTN =================

  const uploadBookBtn = document.getElementById("upload-book-btn");

  if (uploadBookBtn) {
    uploadBookBtn.addEventListener("click", createBook);
  }
});

// ================= AUTH UI =================

const token = localStorage.getItem("token");

const loginLink = document.getElementById("login-link");
const registerLink = document.getElementById("register-link");

const profileLink = document.getElementById("profile-link");
const logoutBtn = document.getElementById("logout-btn");

if (token) {
  if (loginLink) {
    loginLink.classList.add("hidden");
  }

  if (registerLink) {
    registerLink.classList.add("hidden");
  }

  if (profileLink) {
    profileLink.classList.remove("hidden");
  }

  if (logoutBtn) {
    logoutBtn.classList.remove("hidden");
  }
}

// ================= LOGOUT =================

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "index.html";
  });
}
// ================= THEME colors =================

function setTheme(theme) {
  document.body.className = theme;

  localStorage.setItem("theme", theme);
}

// LOAD SAVED THEME
const savedTheme = localStorage.getItem("theme");

if (savedTheme) {
  document.body.className = savedTheme;
}

// ================= search input =================

const searchInput = document.getElementById("search-input");

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const searchValue = searchInput.value.toLowerCase();

    const bookCards = document.querySelectorAll(".book-card");

    bookCards.forEach((card) => {
      const text = card.innerText.toLowerCase();

      if (text.includes(searchValue)) {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    });
  });
}

const user = JSON.parse(localStorage.getItem("user"));

const adminBtn = document.getElementById("admin-btn");

const superAdminBtn = document.getElementById("super-admin-btn");

const themePanel = document.getElementById("theme-panel");

const adminPanel = document.getElementById("admin-panel");

// ================= SUPER ADMIN =================

if (user?.email === "admin@test.com") {
  // show super admin button
  superAdminBtn.classList.remove("hidden");

  // show theme controls
  themePanel.classList.remove("hidden");

  // hide normal admin button
  adminBtn.classList.add("hidden");
}

// ================= ADMIN PANEL =================

if (adminBtn) {
  adminBtn.addEventListener("click", () => {
    adminPanel.classList.remove("hidden");

    adminBtn.disabled = true;

    adminBtn.innerText = "Admin Active";
  });
}
