export { };

const path = location.pathname;
const id = path.substring(path.lastIndexOf("/"));
void (async () => {
  try {
    const res = await fetch(`/api/code/${id}`);
    const { format, input } = await res.json() as { format: string; input: string; };
    localStorage.setItem("format", JSON.stringify(format));
    localStorage.setItem("input", JSON.stringify(input));
  } finally {
    location.pathname = "/";
  }
})();
