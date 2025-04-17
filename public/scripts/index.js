const params = new URLSearchParams(window.location.search);
const token = params.get("token");

if (token) {
  localStorage.setItem("authToken", token);
  window.location.href = "/";
}
