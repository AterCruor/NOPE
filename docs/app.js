const reasonEl = document.getElementById("reason");
const metaEl = document.getElementById("meta");
const statusEl = document.getElementById("status");
const newButton = document.getElementById("new-reason");
const copyButton = document.getElementById("copy-reason");
const shareButton = document.getElementById("share-reason");
const sharePageButton = document.getElementById("share-page");

let reasons = [];
let reasonById = {};
let currentId = "";

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

  const entry = reasons[Math.floor(Math.random() * reasons.length)];
  currentId = entry.id || "";
  reasonEl.textContent = entry.reason;
};

const applyReasonFromId = () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id || !reasonById[id]) {
    return false;
  }

  currentId = id;
  reasonEl.textContent = reasonById[id].reason;
  return true;
};

const loadReasons = async () => {
  try {
    const reasonsResponse = await fetch("reasons.json");
    if (!reasonsResponse.ok) {
      throw new Error("Failed to load reasons.");
    }
    reasons = await reasonsResponse.json();
    reasonById = reasons.reduce((acc, entry) => {
      acc[entry.id] = entry;
      return acc;
    }, {});
    metaEl.textContent = `${reasons.length} reasons ready.`;
    if (!applyReasonFromId()) {
      pickReason();
    }
  } catch (error) {
    reasons = [
      {
        id: "fallback-1",
        reason: "Nope. The reasons are hiding. Try again later.",
        type: "general",
        tone: "neutral",
        topic: "general",
        tags: [],
      },
      {
        id: "fallback-2",
        reason: "Not now. The reasons went out for a coffee.",
        type: "general",
        tone: "neutral",
        topic: "general",
        tags: [],
      },
    ];
    reasonById = {};
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

  const url = currentId
    ? `${window.location.origin}${window.location.pathname}?id=${currentId}`
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
