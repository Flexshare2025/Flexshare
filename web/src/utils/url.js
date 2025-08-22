export function getSearchParam(key) {
  const url = window.location.href;
  const hash = url.substring(url.indexOf("#") + 1);
  const searchIndex = hash.indexOf("?");
  const search = searchIndex !== -1 ? hash.substring(searchIndex + 1) : "";
  const usp = new URLSearchParams(search);
  return usp.get(key);
}
