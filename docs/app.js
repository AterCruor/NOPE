const reasonEl = document.getElementById("reason");
const metaEl = document.getElementById("meta");
const statusEl = document.getElementById("status");
const newButton = document.getElementById("new-reason");
const copyButton = document.getElementById("copy-reason");
const shareButton = document.getElementById("share-reason");
const sharePageButton = document.getElementById("share-page");
const clearFiltersButton = document.getElementById("clear-filters");
const filterToggle = document.getElementById("filter-toggle");
const filters = document.getElementById("filters");
const filterChips = document.getElementById("filter-chips");
const filterWarning = document.getElementById("filter-warning");
const shareMenu = document.querySelector(".share-menu");
const multiSelects = Array.from(document.querySelectorAll(".multi-select"));

let reasons = [];
let reasonById = {};
let currentId = "";
let lastSelectToggle = null;

const formatLabel = (value) =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const setStatus = (message) => {
  statusEl.textContent = message;
};

const clearStatus = () => {
  statusEl.textContent = "";
};

const setWarning = (message) => {
  if (!message) {
    filterWarning.textContent = "";
    filterWarning.classList.remove("show");
    return;
  }
  filterWarning.textContent = message;
  filterWarning.classList.add("show");
};

const getSelectedValues = (key) => {
  const select = multiSelects.find((item) => item.dataset.key === key);
  if (!select) {
    return [];
  }
  return Array.from(select.querySelectorAll("input[type='checkbox']:checked"))
    .map((input) => input.value)
    .filter(Boolean);
};

const hasActiveFilters = () =>
  Boolean(
    getSelectedValues("type").length ||
      getSelectedValues("tone").length ||
      getSelectedValues("topic").length ||
      getSelectedValues("tag").length
  );

const getFilteredReasons = () => {
  const types = getSelectedValues("type");
  const tones = getSelectedValues("tone");
  const topics = getSelectedValues("topic");
  const tags = getSelectedValues("tag");

  return reasons.filter((entry) => {
    if (types.length && !types.includes(entry.type)) {
      return false;
    }
    if (tones.length && !tones.includes(entry.tone)) {
      return false;
    }
    if (topics.length && !topics.includes(entry.topic)) {
      return false;
    }
    const entryTags = entry.tags || [];
    if (tags.length && !tags.some((tag) => entryTags.includes(tag))) {
      return false;
    }
    return true;
  });
};

const updateChips = () => {
  filterChips.innerHTML = "";
  if (!hasActiveFilters() || filters.classList.contains("open")) {
    filterChips.classList.remove("show");
    return;
  }

  const chips = [];
  const buildChip = (key, label) => {
    const values = getSelectedValues(key);
    if (!values.length) {
      return;
    }
    chips.push(`${label}: ${values.map(formatLabel).join(", ")}`);
  };

  buildChip("type", "Type");
  buildChip("tone", "Tone");
  buildChip("topic", "Topic");
  buildChip("tag", "Tag");

  chips.forEach((label) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = label;
    filterChips.appendChild(chip);
  });
  filterChips.classList.add("show");
};

const updateMeta = () => {
  const filtered = getFilteredReasons();
  clearFiltersButton.disabled = !hasActiveFilters();
  metaEl.textContent = "";
  metaEl.appendChild(document.createTextNode(`${reasons.length} reasons loaded.`));
  if (filtered.length === reasons.length) {
    return;
  }
  const matchesText =
    filtered.length === 1 ? "1 matching reason" : `${filtered.length} matching reasons`;
  metaEl.appendChild(document.createElement("br"));
  const matchSpan = document.createElement("span");
  matchSpan.textContent = `${matchesText}.`;
  metaEl.appendChild(matchSpan);
};

const pickReason = () => {
  if (!reasons.length) {
    reasonEl.textContent = "No reasons loaded yet.";
    return;
  }

  const candidates = getFilteredReasons();
  if (!candidates.length) {
    currentId = "";
    reasonEl.textContent = "No reasons match those filters. Try clearing them.";
    return;
  }

  const entry = candidates[Math.floor(Math.random() * candidates.length)];
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

const updateToggleLabel = (select) => {
  const values = Array.from(
    select.querySelectorAll("input[type='checkbox']:checked")
  ).map((input) => formatLabel(input.value));
  const toggle = select.querySelector(".multi-toggle");
  const panelId = select.dataset.panel;
  if (panelId) {
    toggle.setAttribute("aria-controls", panelId);
  }
  toggle.setAttribute("aria-expanded", String(select.classList.contains("open")));
  if (!values.length) {
    toggle.textContent = "Any";
    return;
  }
  toggle.textContent = values.length === 1 ? values[0] : `${values.length} selected`;
};

const wouldMatch = (key, value) => {
  const types = new Set(getSelectedValues("type"));
  const tones = new Set(getSelectedValues("tone"));
  const topics = new Set(getSelectedValues("topic"));
  const tags = new Set(getSelectedValues("tag"));

  if (key === "type") {
    types.add(value);
  } else if (key === "tone") {
    tones.add(value);
  } else if (key === "topic") {
    topics.add(value);
  } else if (key === "tag") {
    tags.add(value);
  }

  return reasons.some((entry) => {
    if (types.size && !types.has(entry.type)) {
      return false;
    }
    if (tones.size && !tones.has(entry.tone)) {
      return false;
    }
    if (topics.size && !topics.has(entry.topic)) {
      return false;
    }
    const entryTags = entry.tags || [];
    if (tags.size && !Array.from(tags).some((tag) => entryTags.includes(tag))) {
      return false;
    }
    return true;
  });
};

const updateOptionAvailability = () => {
  let invalidSelected = false;
  multiSelects.forEach((select) => {
    const key = select.dataset.key;
    select.querySelectorAll(".multi-option").forEach((label) => {
      const input = label.querySelector("input");
      const allowed = wouldMatch(key, input.value);
      input.disabled = !allowed;
      label.classList.toggle("disabled", !allowed);
      label.setAttribute("aria-disabled", String(!allowed));
      if (!allowed && input.checked) {
        invalidSelected = true;
      }
    });
  });

  if (invalidSelected) {
    setWarning("Some selected filters have no matches. Please adjust.");
  } else {
    setWarning("");
  }
};

const refreshUI = () => {
  updateMeta();
  updateChips();
  updateOptionAvailability();
  pickReason();
};

const buildOptions = (key, values) => {
  const select = multiSelects.find((item) => item.dataset.key === key);
  if (!select) {
    return;
  }
  const panel = select.querySelector(".multi-panel");
  panel.innerHTML = "";
  values.forEach((value) => {
    const label = document.createElement("label");
    label.className = "multi-option";
    label.setAttribute("role", "option");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = value;
    checkbox.setAttribute("aria-checked", "false");
    checkbox.addEventListener("change", () => {
      checkbox.setAttribute("aria-checked", String(checkbox.checked));
      updateToggleLabel(select);
      refreshUI();
    });
    const text = document.createElement("span");
    text.textContent = formatLabel(value);
    label.appendChild(checkbox);
    label.appendChild(text);
    panel.appendChild(label);
  });
};

const updateFilters = () => {
  const unique = (key) =>
    Array.from(new Set(reasons.map((entry) => entry[key]).filter(Boolean))).sort();
  const tagValues = Array.from(
    new Set(reasons.flatMap((entry) => entry.tags || []).filter(Boolean))
  ).sort();

  buildOptions("type", unique("type"));
  buildOptions("tone", unique("tone"));
  buildOptions("topic", unique("topic"));
  buildOptions("tag", tagValues);

  multiSelects.forEach(updateToggleLabel);
  updateOptionAvailability();
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
    updateFilters();
    updateMeta();
    updateChips();
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
    updateFilters();
    updateChips();
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

const closeOtherSelects = (current) => {
  multiSelects.forEach((select) => {
    if (select !== current && select.classList.contains("open")) {
      select.classList.remove("open");
      const otherToggle = select.querySelector(".multi-toggle");
      otherToggle?.setAttribute("aria-expanded", "false");
    }
  });
};

const closeAllSelects = () => {
  multiSelects.forEach((select) => {
    if (select.classList.contains("open")) {
      select.classList.remove("open");
      const toggle = select.querySelector(".multi-toggle");
      toggle?.setAttribute("aria-expanded", "false");
    }
  });
};

const handleDropdownKeys = (event) => {
  const activeSelect = multiSelects.find((select) =>
    select.classList.contains("open")
  );
  if (!activeSelect) {
    return;
  }
  const checkboxes = Array.from(activeSelect.querySelectorAll("input[type='checkbox']"));
  const currentIndex = checkboxes.indexOf(document.activeElement);
  if (event.key === "ArrowDown") {
    event.preventDefault();
    const next = checkboxes[currentIndex + 1] || checkboxes[0];
    next?.focus();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    const prev = checkboxes[currentIndex - 1] || checkboxes[checkboxes.length - 1];
    prev?.focus();
  } else if (event.key === " " || event.key === "Enter") {
    if (document.activeElement?.type === "checkbox") {
      event.preventDefault();
      document.activeElement.click();
    }
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
clearFiltersButton.addEventListener("click", () => {
  multiSelects.forEach((select) => {
    select.querySelectorAll("input[type='checkbox']").forEach((input) => {
      input.checked = false;
      input.setAttribute("aria-checked", "false");
    });
    updateToggleLabel(select);
  });
  clearStatus();
  refreshUI();
});

filterToggle.addEventListener("click", () => {
  const isOpen = filters.classList.toggle("open");
  filterToggle.setAttribute("aria-expanded", String(isOpen));
  updateChips();
});

multiSelects.forEach((select) => {
  const toggle = select.querySelector(".multi-toggle");
  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    closeOtherSelects(select);
    select.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(select.classList.contains("open")));
    if (select.classList.contains("open")) {
      lastSelectToggle = toggle;
      const firstCheckbox = select.querySelector("input[type='checkbox']");
      firstCheckbox?.focus();
    }
  });
});

document.addEventListener("click", (event) => {
  if (shareMenu && shareMenu.hasAttribute("open") && !shareMenu.contains(event.target)) {
    shareMenu.removeAttribute("open");
  }
  if (!filters.contains(event.target)) {
    closeAllSelects();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (shareMenu?.hasAttribute("open")) {
      shareMenu.removeAttribute("open");
      const shareToggle = shareMenu.querySelector("summary");
      shareToggle?.focus();
    }
    closeAllSelects();
    lastSelectToggle?.focus();
    return;
  }
  handleDropdownKeys(event);
});

loadReasons();
