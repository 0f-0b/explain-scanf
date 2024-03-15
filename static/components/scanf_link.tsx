import { React } from "../deps/react.ts";

export const ScanfLink: React.FC = () => (
  <a
    href="https://pubs.opengroup.org/onlinepubs/9699919799/functions/fscanf.html"
    target="_blank"
    rel="noreferrer"
    onClick={(event) => {
      try {
        const date = new Date();
        if (
          date.getMonth() === 3 && date.getDate() === 1 &&
          sessionStorage.getItem("e") === null
        ) {
          sessionStorage.setItem("e", "");
          open(
            atob("aHR0cHM6Ly95b3V0dS5iZS9kUXc0dzlXZ1hjUQ"),
            "_blank",
            "noreferrer",
          );
          event.preventDefault();
        }
      } catch {
        // ignored
      }
    }}
  >
    scanf
  </a>
);
