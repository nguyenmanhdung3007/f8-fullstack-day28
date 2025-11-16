//Bài 2
// 2.1 Tạo Promise wrapper cho XHR

function sendRequest(method, url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true); // true/ không có cũng mặc định là true: xử lý bất đồng bộ, false là xử lý đồng bộ

    //lắng nghe reponse trả về từ server
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 400) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data);
        } catch (error) {
          reject(`lỗi parse JSON: ${error}`);
        }
      } else {
        reject(`Lỗi HTTP: ${xhr.status}`);
      }
    };

    xhr.send(); // gửi request

    xhr.onerror = () => {
      reject(new Error("Lỗi mạng!"));
    };
  });
}

// url chung
const API_BASE_URL = "https://jsonplaceholder.typicode.com";

//2.2. Refactor lại 3 chức năng từ Bài 1
// DOM element

const userId = document.querySelector("#user-id-input");
const searchUserBtn = document.querySelector("#search-user-btn");

// user info
const profileCard = document.querySelector("#user-profile-card");
const userAvatar = document.querySelector("#user-avatar");
const userName = document.querySelector("#user-name");
const userEmail = document.querySelector("#user-email");
const userPhone = document.querySelector("#user-phone");
const userWebsite = document.querySelector("#user-website");
const userCompany = document.querySelector("#user-company");
const userAddress = document.querySelector("#user-address");

const userError = document.querySelector("#user-error");
const userErrorText = document.querySelector("#user-error-text");
const userLoading = document.querySelector("#user-loading");

// lắng nghe sự kiện click tìm user
searchUserBtn.addEventListener("click", () => {
  profileCard.classList.remove("show");
  const user = userId.value;
  if (!user) {
    userError.classList.add("show");
    userErrorText.textContent = "Hãy nhập User ID!!!";
    return;
  }
  userLoading.classList.add("show");
  userError.classList.remove("show");
  profileCard.classList.remove("show");

  sendRequest("GET", `${API_BASE_URL}/users/${user}`)
    .then((userData) => {
      // hiển thị thông tin user
      profileCard.classList.add("show");
      userAvatar.textContent = userData.name.charAt(0); // Lấy ký tự đầu tiên
      userName.textContent = userData.name;
      userEmail.textContent = userData.email;
      userPhone.textContent = userData.phone;
      userWebsite.textContent = userData.website;
      userCompany.textContent = userData.company.name;
      userAddress.textContent = `${userData.address.street}, ${userData.address.city}`;
    })
    .catch((error) => {
      console.log(error);
      userError.classList.add("show");
      userErrorText.textContent = `Lỗi: ${error}`;

      clearTimeout(window.errorTimer); // tránh bị chồng timer
      //   tự động tắt thông báo sau 2s
      window.errorTimer = setTimeout(() => {
        userError.classList.remove("show");
      }, 2000);
    })
    .finally(() => {
      // ẩn loading
      userLoading.classList.remove("show");
    });
});

// Chức năng 2: Posts với Comments

// GET DOM ELEMENT
const postLoading = document.querySelector("#posts-loading");
const postError = document.querySelector("#posts-error");
const postErrorText = document.querySelector("#posts-error-text");
const postContainer = document.querySelector("#posts-container");
const templatePost = document.querySelector(".template-post-item");
const loadMoreBtn = document.querySelector("#load-more-posts-btn");

// các biến theo dõi
currentPage = 1;

// load 5 post đầu tiên khi vào trang
document.addEventListener("DOMContentLoaded", () => {
  loadPost(currentPage);
});

function loadPost(page, limit = 5) {
  console.log("render 5 comment");
  postLoading.classList.add("show"); // hiện loading
  postError.classList.remove("show"); // reset error
  // loadMoreBtn.style.display = "none"; //

  sendRequest("GET", `${API_BASE_URL}/posts?_limit=${limit}&_page=${page}`)
    .then((posts) => {
      // nếu res không phải lỗi
      postError.classList.remove("show"); // ẩn error

      // render post sau khi nhận được data posts
      renderPost(posts);
      loadMoreBtn.style.display = "block"; // hiện loadmore khi post được render
    })
    .catch((error) => {
      postError.classList.add("show"); // hiện error
      postErrorText.textContent = `Có lỗi khi tải posts: ${error}`;
    })
    .finally(() => {
      postLoading.classList.remove("show"); //  ẩn loading
    });
}

// hàm render posts
function renderPost(posts) {
  posts.forEach((post) => {
    // lấy template
    const postClone = templatePost.content.cloneNode(true);
    const postItem = postClone.querySelector(".post-item");

    // điền data
    postItem.dataset.postId = post.id;
    postItem.querySelector(".post-title").textContent = post.title;
    postItem.querySelector(".post-body").textContent = post.body;
    postItem.querySelector(".show-comments-btn").dataset.postId = post.id;
    postItem.querySelector(".comments-container").dataset.postId = post.id;

    // lấy tên tác giả
    sendRequest("GET", `${API_BASE_URL}/users/${post.userId}`)
      .then((user) => {
        postItem.querySelector(".author-name").textContent = `${user.name}`;
      })
      .catch((error) => {
        postError.classList.add("show");
        postErrorText.textContent = `Không lấy được tên tác giả: ${error}`;
        postItem.querySelector(
          ".author-name"
        ).textContent = `Không load được tên tác giả`;
      });
    // thêm post vào dom
    postContainer.appendChild(postItem);
  });
}

// lắng nghe sự kiện xem comments sử dụng delegation
postContainer.addEventListener("click", (e) => {
  // selector vào show comment btn
  const target = e.target.closest(".show-comments-btn");
  if (!target) return;
  //   lấy ra post id từ dataset
  const postId = target.dataset.postId;
  //   call api lấy data comment
  sendRequest("GET", `${API_BASE_URL}/posts/${postId}/comments`)
    //   nếu thành công
    .then((comments) => {
      renderComments(comments, target);
    })
    // nếu lỗi
    .catch((error) => {
      console.log(error);
    });
});

// render comment
function renderComments(comments, button) {
  const postId = button.dataset.postId;

  //   lấy ra dom của commentContainer thông qua dataset
  const commentContainer = document.querySelector(
    `.comments-container[data-post-id="${postId}"]`
  );

  //   check xem nội dung của comment có được hiển thị hay không
  const isShow = commentContainer.classList.contains("show");

  //   nếu chưa show
  if (!isShow) {
    const commentHtml = comments
      .map((comment) => {
        return `<div class="comment-item">
      <div class="comment-author">${comment.name}</div>
      <div class="comment-email">${comment.email}</div>
      <div class="comment-body">${comment.body}</div>
    </div>`;
      })
      .join("");

    commentContainer.innerHTML = commentHtml;

    //   thay đổi text content trong btn
    button.textContent = "Ẩn Comments";

    // hiển thị comments trong container
    commentContainer.classList.add("show");
  } else {
    // nếu mà đang hiện thì ẩn comment
    commentContainer.classList.remove("show");
    button.textContent = "Xem Comments";
  }
}

loadMoreBtn.addEventListener("click", () => {
  console.log("click load more btn");
  currentPage++;
  loadPost(currentPage);
});

// Chức năng 3: Todo List với Filter

const todoInput = document.querySelector("#todo-user-id-input");
const loadTodoBtn = document.querySelector("#load-todos-btn");
const todoLoading = document.querySelector("#todos-loading");
const todoError = document.querySelector("#todos-error");
const todoErrorText = document.querySelector("#todos-error-text");
const todoList = document.querySelector("#todo-list");

//
const totalTodo = document.querySelector("#total-todos");
const completedTodo = document.querySelector("#completed-todos");
const incompleteTodo = document.querySelector("#incomplete-todos");

// btn
const todoFilters = document.querySelector(".todo-filters");
let currentFilter = "all";
let listTodo = [];

loadTodoBtn.addEventListener("click", () => {
  todoList.innerHTML = "";

  const userId = todoInput.value;
  if (!userId) {
    todoError.classList.add("show");
    todoErrorText.textContent = "Vui lòng nhập userID phù hợp";
  }

  todoLoading.classList.add("show");

  sendRequest("GET", `${API_BASE_URL}//users/${userId}/todos`)
    .then((todos) => {
      todoError.classList.remove("show");

      //gán lại todos
      listTodo = todos;

      // render todo list
      renderTodoList(todos, currentFilter);
    })
    .catch((error) => {
      todoError.classList.add("show");
      todoErrorText.textContent = `Có lỗi khi load todo: ${error}`;
    })
    .finally(() => {
      todoLoading.classList.remove("show");
    });
});

function renderTodoList(todos, filter) {
  if (!todos) return;
  let array;
  //   cập nhật total todo
  totalTodo.textContent = todos.length;
  //   cập nhập completed todo
  completedTodo.textContent = todos.filter(
    (item) => item.completed === true
  ).length;
  //   cập nhập incomplete todo
  incompleteTodo.textContent = todos.filter(
    (item) => item.completed === false
  ).length;

  //   kiểm tra trạng thái của filter để cập nhật lại mảng todo để render
  if (filter === "all") {
    array = todos;
  } else if (filter === "completed") {
    array = todos.filter((item) => item.completed === true);
  } else if (filter === "incomplete") {
    array = todos.filter((item) => item.completed === false);
  }

  //   tạo list = todoslist html
  const todoListHtml = array
    .map((item) => {
      return `<div class="todo-item  ${
        item.completed ? "completed" : "incomplete"
      }" data-todo-id="${item.id}" data-completed="${item.completed}">
      <div class="todo-checkbox ${
        item.completed ? "completed" : "incomplete"
      }"></div>
      <div class="todo-text ${item.completed ? "completed" : "incomplete"}">${
        item.title
      }</div>
    </div>`;
    })
    .join("");
  todoList.innerHTML = todoListHtml;
}

/* Click: Các nút filter */
todoFilters.addEventListener("click", (e) => {
  // Kiểm tra xem có phải button không
  const isButton = e.target.tagName === "BUTTON";
  if (isButton) {
    // Bỏ active ở button cũ
    document.querySelector(".filter-btn.active").classList.remove("active");
    // Thêm active cho button mới
    e.target.classList.add("active");
    // Cập nhật trạng thái của filter hiện tại
    currentFilter = e.target.dataset.filter;
    // render lại todolist
    renderTodoList(listTodo, currentFilter);
  }
});
