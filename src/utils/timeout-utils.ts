const key = "cache-timeouts";

export function addTimeoutToLocalStorage(timeoutId: number) {
   const timeouts = getTimeouts();
   timeouts.push(timeoutId.toString());
   localStorage.setItem(key, timeouts.join(","));
}

export function removeTimeoutFromLocalStorage(timeoutId: number) {
   const timeouts = getTimeouts();
   if (timeouts.length) {
      const updatedTimeouts = timeouts.filter((id) => id !== timeoutId.toString());
      localStorage.setItem(key, updatedTimeouts.join(","));
   }
}
export function clearAllTimeoutsInLocalStorage() {
   const timeouts = getTimeouts();
   timeouts.forEach((id) => clearTimeout(Number(id)));
   localStorage.removeItem(key);
}

function getTimeouts(): string[] {
   const timeouts = localStorage.getItem(key);
   return timeouts ? timeouts.split(",") : [];
}
