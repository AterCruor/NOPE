const reasonEl = document.getElementById("reason");
const metaEl = document.getElementById("meta");
const statusEl = document.getElementById("status");
const newButton = document.getElementById("new-reason");
const copyButton = document.getElementById("copy-reason");
const shareButton = document.getElementById("share-reason");
const sharePageButton = document.getElementById("share-page");

let reasons = [];
let reasonMap = {};
let hashByReason = {};
let currentHash = "";

const setStatus = (message) => {
  statusEl.textContent = message;
};

const clearStatus = () => {
  statusEl.textContent = "";
};

const pickReason = () => {
  if (!reasons.length) {
    reasonEl.textContent = "No reasons loaded yet.";
    return;
  }

  const reason = reasons[Math.floor(Math.random() * reasons.length)];
  currentHash = hashByReason[reason] || "";
  reasonEl.textContent = reason;
};

const applyReasonFromHash = () => {
  const params = new URLSearchParams(window.location.search);
  const hash = params.get("r");
  if (!hash || !reasonMap[hash]) {
    return false;
  }

  currentHash = hash;
  reasonEl.textContent = reasonMap[hash];
  return true;
};

const loadReasons = async () => {
  try {
    const [reasonsResponse, mapResponse] = await Promise.all([
      fetch("reasons.json"),
      fetch("reasons-map.json"),
    ]);
    if (!reasonsResponse.ok || !mapResponse.ok) {
      throw new Error("Failed to load reasons.");
    }
    reasons = await reasonsResponse.json();
    reasonMap = await mapResponse.json();
    hashByReason = Object.entries(reasonMap).reduce((acc, [hash, text]) => {
      acc[text] = hash;
      return acc;
    }, {});
    metaEl.textContent = `${reasons.length} reasons ready.`;
    if (!applyReasonFromHash()) {
      pickReason();
    }
  } catch (error) {
    reasons = [
      "Nope. The reasons are hiding. Try again later.",
      "Not now. The reasons went out for a coffee.",
    ];
    reasonMap = {};
    hashByReason = {};
    metaEl.textContent = "Offline fallback mode.";
    pickReason();
  }
};

const copyReason = async () => {
  try {
    await navigator.clipboard.writeText(reasonEl.textContent.trim());
    copyButton.textContent = "Copied!";
    setTimeout(() => {
      copyButton.textContent = "Copy";
    }, 1200);
  } catch (error) {
    copyButton.textContent = "Copy";
  }
};

const shareReason = async () => {
  clearStatus();
  const reason = reasonEl.textContent.trim();
  if (!reason) {
    return;
  }

  if (navigator.share) {
    try {
      await navigator.share({
        title: "No-as-a-Service",
        text: reason,
      });
      return;
    } catch (error) {
      if (error && error.name === "AbortError") {
        setStatus("Share canceled");
        return;
      }
      // Fall back to copy when share is unsupported or fails.
    }
  }

  try {
    await navigator.clipboard.writeText(reason);
    shareButton.textContent = "Copied!";
    setTimeout(() => {
      shareButton.textContent = "Share";
    }, 1200);
  } catch (error) {
    setStatus("Copy failed");
  }
};

const sharePage = async () => {
  clearStatus();
  const reason = reasonEl.textContent.trim();
  if (!reason) {
    return;
  }

  const url = currentHash
    ? `${window.location.origin}${window.location.pathname}?r=${currentHash}`
    : window.location.href;
  if (navigator.share) {
    try {
      await navigator.share({
        title: "No-as-a-Service",
        url,
      });
      return;
    } catch (error) {
      if (error && error.name === "AbortError") {
        setStatus("Share canceled");
        return;
      }
      // Fall back to copy when share is unsupported or fails.
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    sharePageButton.textContent = "Copied!";
    setTimeout(() => {
      sharePageButton.textContent = "Share Page";
    }, 1200);
  } catch (error) {
    setStatus("Copy failed");
  }
};

newButton.addEventListener("click", () => {
  clearStatus();
  pickReason();
});
copyButton.addEventListener("click", () => {
  clearStatus();
  copyReason();
});
shareButton.addEventListener("click", shareReason);
sharePageButton.addEventListener("click", sharePage);

loadReasons();
