const ADMIN_PASSWORD = "reaper1976";
const MEMBER_PASSWORD = "brotherhood";
const STORAGE_KEY = "soa_admin_unlocked";
const ROLE_KEY = "soa_role";
const ROLE_NAME_KEY = "soa_role_name";
const firebaseStore = window.firebaseStore;
const firebaseEnabled = Boolean(firebaseStore?.enabled);
const firebaseAuth = window.firebaseAuth;
const authEnabled = Boolean(firebaseAuth?.enabled);
if (!firebaseEnabled) {
  console.warn("Firebase Firestore is not initialized. Sync is disabled.");
}
const ROLE_EMAILS = {
  admin: ["admin@soa.local","trex@soa.local", "pterodaktyl@soa.local"],
  member: "member@soa.local",
};
const getRoleEmail = (role) => ROLE_EMAILS[role] || ROLE_EMAILS.member;
const inferRoleFromEmail = (email = "") => {
  const normalized = email.toLowerCase();
  if (Array.isArray(ROLE_EMAILS.admin) && ROLE_EMAILS.admin.map((item) => item.toLowerCase()).includes(normalized)) {
    return "admin";
  }
  if (normalized === ROLE_EMAILS.member) return "member";
  return "member";
};

const getFirebaseAuthErrorMessage = (error) => {
  const code = error?.code || "";
  if (code === "auth/unauthorized-domain") {
    return "Nepovolená doména. Přidej doménu v Firebase Auth → Authorized domains.";
  }
  if (code === "auth/operation-not-allowed") {
    return "Email/heslo přihlášení není povoleno ve Firebase Auth.";
  }
  if (code === "auth/user-not-found") {
    return "Uživatel nenalezen. Zkontroluj e-mail nebo vytvoř účet ve Firebase Auth.";
  }
  if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
    return "Nesprávné heslo. Zkus to znovu.";
  }
  return `Přihlášení přes Firebase selhalo${code ? ` (${code})` : ""}.`;
};

const resolveAccountByEmail = async (email) => {
  if (!email) return null;
  const normalized = email.toLowerCase();
  let accounts = getAccounts();
  if (!accounts.length && firebaseEnabled) {
    try {
      const remote = await firebaseStore.getDocValue(ACCOUNTS_KEY);
      if (Array.isArray(remote)) {
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(remote));
        accounts = remote;
      }
    } catch {
      // ignore
    }
  }
  return accounts.find((account) => (account.email || "").toLowerCase() === normalized) || null;
};

const loginModal = document.getElementById("loginModal");
const openLoginButtons = [
  document.getElementById("openLogin"),
  document.getElementById("openLogin2"),
].filter(Boolean);
const closeLogin = document.getElementById("closeLogin");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const accountingContent = document.getElementById("accountingContent");
const accountingLock = document.getElementById("accountingLock");
const adminContent = document.getElementById("adminContent");
const adminLock = document.getElementById("adminLock");
const memberContent = document.getElementById("memberContent");
const memberLock = document.getElementById("memberLock");
const logoutButton = document.getElementById("logout");
const navLinks = document.querySelectorAll(".nav__links a");
const roleLinks = document.querySelectorAll("[data-role]");
const openRoleLogin = document.getElementById("openRoleLogin");
const openRoleLogin2 = document.getElementById("openRoleLogin2");
const logoutRole = document.getElementById("logoutRole");
const roleModal = document.getElementById("roleModal");
const roleForm = document.getElementById("roleForm");
const roleEmail = document.getElementById("roleEmail");
const rolePassword = document.getElementById("rolePassword");
const roleSelect = document.getElementById("roleSelect");
const roleError = document.getElementById("roleError");
const closeRole = document.getElementById("closeRole");
const roleStatus = document.getElementById("roleStatus");
const editToggle = document.getElementById("toggleEdit");
const saveEdits = document.getElementById("saveEdits");
const resetEdits = document.getElementById("resetEdits");
const addTransaction = document.getElementById("addTransaction");
const transactionBody = document.getElementById("transactionBody");
const totalIncome = document.querySelector("[data-total='income']");
const totalExpenses = document.querySelector("[data-total='expenses']");
const totalReserve = document.querySelector("[data-total='reserve']");
const barIncome = document.querySelector("[data-total='bar-income']");
const barExpenses = document.querySelector("[data-total='bar-expenses']");
const barNet = document.querySelector("[data-total='bar-net']");
const workshopIncome = document.querySelector("[data-total='workshop-income']");
const workshopExpenses = document.querySelector("[data-total='workshop-expenses']");
const workshopNet = document.querySelector("[data-total='workshop-net']");
const charterIncome = document.querySelector("[data-total='charter-income']");
const charterExpenses = document.querySelector("[data-total='charter-expenses']");
const charterNet = document.querySelector("[data-total='charter-net']");
const flowIncome = document.querySelector("[data-flow='income']");
const flowExpenses = document.querySelector("[data-flow='expenses']");
const flowNet = document.querySelector("[data-flow='net']");
const topEarnerName = document.getElementById("topEarnerName");
const topEarnerAmount = document.getElementById("topEarnerAmount");
const topEarners = document.getElementById("topEarners");
const getEditableNodes = () => document.querySelectorAll("[data-editable-key]");
const EDITS_KEY = "soa_accounting_edits";
const TX_KEY = "soa_accounting_transactions";
const AUDIT_KEY = "soa_audit_logs";
const INVENTORY_KEY = "soa_inventory_deliveries";
const ANNOUNCEMENTS_KEY = "soa_announcements";
const BANNER_KEY = "soa_banner_notice";
const GALLERY_KEY = "soa_gallery_items";
const ACCOUNTS_KEY = "soa_accounts";
const RENTAL_KEY = "soa_rental_requests";
const RENTAL_WEBHOOK_KEY = "soa_rental_webhook";
const DEBTS_KEY = "soa_debts";
const hydrateFromFirebase = async () => {
  if (!firebaseEnabled) return;
  const keys = [
    EDITS_KEY,
    TX_KEY,
    AUDIT_KEY,
    INVENTORY_KEY,
    ANNOUNCEMENTS_KEY,
    BANNER_KEY,
    GALLERY_KEY,
    ACCOUNTS_KEY,
    RENTAL_KEY,
    RENTAL_WEBHOOK_KEY,
    DEBTS_KEY,
  ];
  const results = await Promise.all(
    keys.map(async (key) => {
      try {
        const value = await firebaseStore.getDocValue(key);
        return { key, value };
      } catch {
        return { key, value: null };
      }
    })
  );
  results.forEach(({ key, value }) => {
    if (value !== null && value !== undefined) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  });
};
const auditList = document.getElementById("auditList");
const txCount = document.getElementById("txCount");
const lastSave = document.getElementById("lastSave");
const auditCount = document.getElementById("auditCount");
const recentTransactions = document.getElementById("recentTransactions");
const recentEdits = document.getElementById("recentEdits");
const clearAudit = document.getElementById("clearAudit");
const inventoryBody = document.getElementById("inventoryBody");
const inventoryItem = document.getElementById("inventoryItem");
const inventoryQty = document.getElementById("inventoryQty");
const inventoryDate = document.getElementById("inventoryDate");
const addInventory = document.getElementById("addInventory");
const announcementList = document.getElementById("announcementList");
const announcementAdminList = document.getElementById("announcementAdminList");
const announcementTitle = document.getElementById("announcementTitle");
const announcementMessage = document.getElementById("announcementMessage");
const announcementActive = document.getElementById("announcementActive");
const addAnnouncement = document.getElementById("addAnnouncement");
const saveAnnouncements = document.getElementById("saveAnnouncements");
const announcementModal = document.getElementById("announcementModal");
const openAnnouncementModal = document.getElementById("openAnnouncementModal");
const closeAnnouncementModal = document.getElementById("closeAnnouncementModal");
const announcementForm = document.getElementById("announcementForm");
const galleryGrid = document.getElementById("galleryGrid");
const galleryAdminList = document.getElementById("galleryAdminList");
const galleryForm = document.getElementById("galleryForm");
const galleryTitle = document.getElementById("galleryTitle");
const galleryImageUrl = document.getElementById("galleryImageUrl");
const galleryCaption = document.getElementById("galleryCaption");
const galleryActive = document.getElementById("galleryActive");
const saveGallery = document.getElementById("saveGallery");
const topNotice = document.getElementById("topNotice");
const topNoticeTitle = document.getElementById("topNoticeTitle");
const topNoticeMessage = document.getElementById("topNoticeMessage");
const closeNotice = document.getElementById("closeNotice");
const bannerTitle = document.getElementById("bannerTitle");
const bannerMessage = document.getElementById("bannerMessage");
const bannerActive = document.getElementById("bannerActive");
const saveBanner = document.getElementById("saveBanner");
const rentalForm = document.getElementById("rentalForm");
const rentalSubmit = document.getElementById("rentalSubmit");
const eventName = document.getElementById("eventName");
const eventDate = document.getElementById("eventDate");
const eventSize = document.getElementById("eventSize");
const eventContact = document.getElementById("eventContact");
const eventNotes = document.getElementById("eventNotes");
const rentalStatus = document.getElementById("rentalStatus");
const rentalList = document.getElementById("rentalList");
const rentalCount = document.getElementById("rentalCount");
const rentalBadge = document.getElementById("rentalBadge");
const rentalWebhook = document.getElementById("rentalWebhook");
const saveRentalWebhookButton = document.getElementById("saveRentalWebhook");
const accountName = document.getElementById("accountName");
const accountRole = document.getElementById("accountRole");
const accountActivity = document.getElementById("accountActivity");
const accountEmail = document.getElementById("accountEmail");
const accountPassword = document.getElementById("accountPassword");
const accountNote = document.getElementById("accountNote");
const createAccount = document.getElementById("createAccount");
const accountList = document.getElementById("accountList");
const accountListDetailed = document.getElementById("accountListDetailed");
const saveAccountsButton = document.getElementById("saveAccounts");
const accountManagementContent = document.getElementById("accountManagementContent");
const accountManagementLock = document.getElementById("accountManagementLock");
const transactionModal = document.getElementById("transactionModal");
const closeTransaction = document.getElementById("closeTransaction");
const transactionForm = document.getElementById("transactionForm");
const txDate = document.getElementById("txDate");
const txSection = document.getElementById("txSection");
const txType = document.getElementById("txType");
const txDesc = document.getElementById("txDesc");
const txItemLabel = document.getElementById("txItemLabel");
const txItem = document.getElementById("txItem");
const txCharterLabel = document.getElementById("txCharterLabel");
const txCharterDesc = document.getElementById("txCharterDesc");
const txQty = document.getElementById("txQty");
const txAmount = document.getElementById("txAmount");
const txEntered = document.getElementById("txEntered");
const txApprove = document.getElementById("txApprove");
const addDebt = document.getElementById("addDebt");
const debtTableBody = document.getElementById("debtTableBody");
const debtModal = document.getElementById("debtModal");
const debtTitle = document.getElementById("debtTitle");
const closeDebt = document.getElementById("closeDebt");
const debtForm = document.getElementById("debtForm");
const debtType = document.getElementById("debtType");
const debtPerson = document.getElementById("debtPerson");
const debtReason = document.getElementById("debtReason");
const debtPrincipal = document.getElementById("debtPrincipal");
const debtInterestRate = document.getElementById("debtInterestRate");
const debtInterestAmount = document.getElementById("debtInterestAmount");
const debtTotal = document.getElementById("debtTotal");
const debtStartDate = document.getElementById("debtStartDate");
const debtDueDate = document.getElementById("debtDueDate");
const debtStatus = document.getElementById("debtStatus");
const debtNote = document.getElementById("debtNote");
const debtTotalOwed = document.querySelector("[data-debt-total='owed']");
const debtTotalReceivable = document.querySelector("[data-debt-total='receivable']");
const debtTotalNet = document.querySelector("[data-debt-total='net']");

const showModal = () => {
  if (!loginModal) return;
  loginModal.classList.add("show");
  loginModal.setAttribute("aria-hidden", "false");
  if (loginError) loginError.textContent = "";
  if (adminEmail) adminEmail.value = "";
  if (adminPassword) adminPassword.value = "";
  adminPassword?.focus();
};

const hideModal = () => {
  if (!loginModal) return;
  loginModal.classList.remove("show");
  loginModal.setAttribute("aria-hidden", "true");
};


const unlockAccounting = () => {
  if (accountingContent) accountingContent.hidden = false;
  if (accountingLock) accountingLock.hidden = true;
  if (adminContent) adminContent.hidden = false;
  if (adminLock) adminLock.hidden = true;
  sessionStorage.setItem(STORAGE_KEY, "true");
};

const lockAccounting = () => {
  if (accountingContent) accountingContent.hidden = true;
  if (accountingLock) accountingLock.hidden = false;
  if (adminContent) adminContent.hidden = true;
  if (adminLock) adminLock.hidden = false;
  sessionStorage.removeItem(STORAGE_KEY);
};

const unlockMemberArea = () => {
  if (memberContent) memberContent.hidden = false;
  if (memberLock) memberLock.hidden = true;
};

const lockMemberArea = () => {
  if (memberContent) memberContent.hidden = true;
  if (memberLock) memberLock.hidden = false;
};

const showRoleModal = () => {
  if (!roleModal) return;
  roleModal.classList.add("show");
  roleModal.setAttribute("aria-hidden", "false");
  if (roleError) roleError.textContent = "";
  if (roleEmail) roleEmail.value = "";
  if (rolePassword) rolePassword.value = "";
  rolePassword?.focus();
};

const hideRoleModal = () => {
  if (!roleModal) return;
  roleModal.classList.remove("show");
  roleModal.setAttribute("aria-hidden", "true");
};

const setRole = (role, name = "") => {
  if (role) sessionStorage.setItem(ROLE_KEY, role);
  else sessionStorage.removeItem(ROLE_KEY);
  if (name) sessionStorage.setItem(ROLE_NAME_KEY, name);
  else sessionStorage.removeItem(ROLE_NAME_KEY);
  updateRoleUI();
};

const getCurrentRole = () => sessionStorage.getItem(ROLE_KEY) || "";
const isAdminRole = () => getCurrentRole() === "admin";

const updateRoleUI = () => {
  const role = getCurrentRole();
  roleLinks.forEach((link) => {
    const required = link.dataset.role;
    const allow = role === required || (required === "member" && role === "admin");
    link.hidden = !allow;
  });

  if (openRoleLogin) openRoleLogin.hidden = Boolean(role);
  if (logoutRole) logoutRole.hidden = !role;

  if (roleStatus) {
    const displayName = sessionStorage.getItem(ROLE_NAME_KEY);
    if (!role) {
      roleStatus.hidden = true;
      roleStatus.textContent = "";
    } else {
      roleStatus.hidden = false;
      roleStatus.textContent = displayName
        ? `Přihlášen: ${displayName}`
        : role === "admin"
          ? "Přihlášen: Admin"
          : "Přihlášen: Člen";
    }
  }

  if (role === "admin") {
    unlockAccounting();
    unlockMemberArea();
    if (accountManagementContent) accountManagementContent.hidden = false;
    if (accountManagementLock) accountManagementLock.hidden = true;
  } else if (role === "member") {
    unlockAccounting();
    unlockMemberArea();
    if (accountManagementContent) accountManagementContent.hidden = true;
    if (accountManagementLock) accountManagementLock.hidden = false;
  } else {
    lockAccounting();
    lockMemberArea();
    if (accountManagementContent) accountManagementContent.hidden = true;
    if (accountManagementLock) accountManagementLock.hidden = false;
  }

  applyAccountingAccess(role);

};

const applyAccountingAccess = (role) => {
  const adminOnly = document.querySelectorAll("[data-access='admin']");
  adminOnly.forEach((node) => {
    node.hidden = role !== "admin";
  });

  if (editToggle) editToggle.hidden = role !== "admin";
  if (saveEdits) saveEdits.hidden = role !== "admin";
  if (resetEdits) resetEdits.hidden = role !== "admin";

  if (role !== "admin") setEditingState(false);

  renderTransactions(role !== "admin");
  if (addDebt) addDebt.hidden = role !== "admin";
  renderDebts(role !== "admin");
};

const getDisplayNameForRole = (role) => {
  const accounts = getAccounts();
  const match = accounts.find((account) => account.role === role && account.name);
  if (match?.name) return match.name;
  return role === "admin" ? "Admin" : "Člen";
};

if (authEnabled) {
  firebaseAuth.onAuthStateChanged(async (user) => {
    if (user?.email) {
      const account = await resolveAccountByEmail(user.email);
      const role = account?.role || inferRoleFromEmail(user.email);
      const name = account?.name || getDisplayNameForRole(role);
      setRole(role, name);
    } else {
      setRole("");
    }
  });
}


openLoginButtons.forEach((btn) => btn.addEventListener("click", showModal));
closeLogin?.addEventListener("click", hideModal);
loginModal?.addEventListener("click", (event) => {
  if (event.target === loginModal) hideModal();
});

const handleAdminLogin = async (event) => {
  event?.preventDefault();
  const password = adminPassword?.value || "";
  if (authEnabled) {
    try {
      const email = adminEmail?.value?.trim();
      if (!email) {
        if (loginError) loginError.textContent = "Zadej e-mail pro Firebase přihlášení.";
        return;
      }
      await firebaseAuth.signIn(email, password);
      const account = await resolveAccountByEmail(email);
      const role = account?.role || "admin";
      const name = account?.name || getDisplayNameForRole(role);
      if (role === "admin") unlockAccounting();
      setRole(role, name);
      addAudit("Admin ověření úspěšné (Firebase)");
      hideModal();
      return;
    } catch (error) {
      if (loginError) loginError.textContent = getFirebaseAuthErrorMessage(error);
      return;
    }
  }
  let valid = password === ADMIN_PASSWORD;
  if (firebaseEnabled) {
    try {
      const remote = await firebaseStore.getDocValue(ACCOUNTS_KEY);
      if (Array.isArray(remote)) {
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(remote));
        valid = remote.some((account) => account.role === "admin" && account.password === password);
      }
    } catch {
      // fallback to local validation
    }
  }
  if (valid) {
    unlockAccounting();
    setRole("admin");
    addAudit("Admin ověření úspěšné");
    hideModal();
    return;
  }
  if (loginError) loginError.textContent = "Nesprávné heslo. Zkus to znovu.";
};

loginForm?.addEventListener("submit", handleAdminLogin);
loginForm?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") handleAdminLogin(event);
});
loginForm
  ?.querySelector("button[type='submit']")
  ?.addEventListener("click", (event) => handleAdminLogin(event));

document.addEventListener(
  "submit",
  (event) => {
    if (event.target?.id === "loginForm") handleAdminLogin(event);
  },
  true
);

document.addEventListener("click", (event) => {
  if (event.target?.closest("#loginForm button[type='submit']")) {
    handleAdminLogin(event);
  }
});

logoutButton?.addEventListener("click", () => {
  lockAccounting();
  addAudit("Admin odhlášen");
  if (authEnabled) firebaseAuth.signOut().catch(() => {});
});

openRoleLogin?.addEventListener("click", showRoleModal);
openRoleLogin2?.addEventListener("click", showRoleModal);
closeRole?.addEventListener("click", hideRoleModal);
roleModal?.addEventListener("click", (event) => {
  if (event.target === roleModal) hideRoleModal();
});

const handleRoleLogin = async (event) => {
  event?.preventDefault();
  const selectedRole = roleSelect?.value || "member";
  const password = rolePassword?.value || "";
  const isAdmin = selectedRole === "admin";
  if (authEnabled) {
    try {
      const email = roleEmail?.value?.trim();
      if (!email) {
        if (roleError) roleError.textContent = "Zadej e-mail pro Firebase přihlášení.";
        return;
      }
      await firebaseAuth.signIn(email, password);
      const account = await resolveAccountByEmail(email);
      const role = account?.role || selectedRole;
      const displayName = account?.name || getDisplayNameForRole(role);
      setRole(role, displayName);
      hideRoleModal();
      return;
    } catch (error) {
      if (roleError) roleError.textContent = getFirebaseAuthErrorMessage(error);
      return;
    }
  }
  let accounts = getAccounts();
  if (firebaseEnabled) {
    try {
      const remote = await firebaseStore.getDocValue(ACCOUNTS_KEY);
      if (Array.isArray(remote)) {
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(remote));
        accounts = remote;
      }
    } catch {
      // fallback to local accounts
    }
  }
  const matchedAccount = accounts.find(
    (account) => account.role === selectedRole && account.password === password
  );
  const fallbackValid = isAdmin ? password === ADMIN_PASSWORD : password === MEMBER_PASSWORD;
  const valid = Boolean(matchedAccount || fallbackValid);
  if (!valid) {
    if (roleError) roleError.textContent = "Nesprávné heslo. Zkus to znovu.";
    return;
  }
  const displayName = matchedAccount?.name || (isAdmin ? "Admin" : "Člen");
  setRole(selectedRole, displayName);
  if (isAdmin) addAudit("Admin přihlášen");
  hideRoleModal();
};

roleForm?.addEventListener("submit", handleRoleLogin);
roleForm?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") handleRoleLogin(event);
});
roleForm
  ?.querySelector("button[type='submit']")
  ?.addEventListener("click", (event) => handleRoleLogin(event));

document.addEventListener(
  "submit",
  (event) => {
    if (event.target?.id === "roleForm") handleRoleLogin(event);
  },
  true
);

document.addEventListener("click", (event) => {
  if (event.target?.closest("#roleForm button[type='submit']")) {
    handleRoleLogin(event);
  }
});

logoutRole?.addEventListener("click", () => {
  setRole("");
  addAudit("Odhlášení role");
  if (authEnabled) firebaseAuth.signOut().catch(() => {});
});

if (sessionStorage.getItem(STORAGE_KEY) === "true") {
  unlockAccounting();
}

if (navLinks.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => link.classList.remove("active"));
          const activeLink = document.querySelector(`.nav__links a[href="#${entry.target.id}"]`);
          activeLink?.classList.add("active");
        }
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll("section").forEach((section) => observer.observe(section));
}

const setEditingState = (enabled) => {
  getEditableNodes().forEach((node) => {
    node.contentEditable = enabled ? "true" : "false";
    node.classList.toggle("is-editing", enabled);
  });
  if (editToggle) editToggle.textContent = enabled ? "Ukončit editaci" : "Editovat";
};

const loadEdits = () => {
  const stored = localStorage.getItem(EDITS_KEY);
  if (!stored) return;
  try {
    const data = JSON.parse(stored);
    getEditableNodes().forEach((node) => {
      const key = node.dataset.editableKey;
      if (key && data[key]) node.textContent = data[key];
    });
  } catch {
    localStorage.removeItem(EDITS_KEY);
  }
};

const saveEditsToStorage = () => {
  const payload = {};
  getEditableNodes().forEach((node) => {
    const key = node.dataset.editableKey;
    if (key) payload[key] = node.textContent.trim();
  });
  localStorage.setItem(EDITS_KEY, JSON.stringify(payload));
  if (firebaseEnabled) firebaseStore.setDocValue(EDITS_KEY, payload).catch(() => {});
  if (transactionBody) {
    const rows = Array.from(transactionBody.querySelectorAll("tr")).map((row) => {
      const cells = row.querySelectorAll("td");
      const itemSelect = cells[4]?.querySelector("[data-item-select]");
      const itemInput = cells[4]?.querySelector("[data-item-input]");
      const qtyInput = cells[5]?.querySelector("[data-qty-input]");
      return {
        date: cells[0]?.textContent?.trim() || "",
        desc: cells[1]?.textContent?.trim() || "",
        section: cells[2]?.textContent?.trim() || "",
        type: cells[3]?.textContent?.trim() || "",
        item: itemSelect?.value || itemInput?.value || "—",
        qty: Number(qtyInput?.value || 0),
        amount: cells[6]?.textContent?.trim() || "",
        enteredBy: cells[7]?.textContent?.trim() || "",
        approve: cells[8]?.textContent?.trim() || "",
      };
    });
    saveTransactions(rows);
  }
};

loadEdits();

const getStoredTransactions = () => {
  const stored = localStorage.getItem(TX_KEY);
  if (!stored) return [];
  try {
    const rows = JSON.parse(stored);
    return Array.isArray(rows) ? rows : [];
  } catch {
    localStorage.removeItem(TX_KEY);
    return [];
  }
};

const saveTransactions = (rows) => {
  localStorage.setItem(TX_KEY, JSON.stringify(rows));
  if (firebaseEnabled) firebaseStore.setDocValue(TX_KEY, rows).catch(() => {});
};

const buildTransactionRow = (row, readOnly = false, index = 0) => {
  const id = `t${index}-${Date.now()}`;
  const tr = document.createElement("tr");
  tr.dataset.readonly = readOnly ? "true" : "false";
  const sectionValue = row.section || "Charter";
  const sectionType = getSectionType(sectionValue);
  const editableCell = (key, value) =>
    readOnly
      ? `<td>${value || ""}</td>`
      : `<td class="editable" data-editable-key="${id}-${key}">${value || ""}</td>`;
  const qtyValue = Number(row.qty || 0);
  const qtyInput = readOnly
    ? `<input class="qty-input" type="number" min="0" value="${qtyValue}" data-qty-input disabled />`
    : `<input class="qty-input" type="number" min="0" value="${qtyValue}" data-qty-input />`;

  tr.innerHTML = `
    ${editableCell("date", row.date)}
    ${editableCell("desc", row.desc)}
    ${editableCell("section", sectionValue)}
    ${editableCell("type", row.type)}
    <td>
      ${buildItemCellContent(sectionType, row.item || "", readOnly)}
    </td>
    <td>${qtyInput}</td>
    ${editableCell("amount", row.amount)}
    ${editableCell("entered", row.enteredBy || "Admin")}
    ${editableCell("approve", row.approve)}
  `;
  return tr;
};

const renderTransactions = (readOnly = false) => {
  if (!transactionBody) return;
  const rows = getStoredTransactions();
  transactionBody.innerHTML = "";
  rows.forEach((row, index) => {
    transactionBody.appendChild(buildTransactionRow(row, readOnly, index));
  });
  Array.from(transactionBody.querySelectorAll("tr")).forEach((row) => {
    updateItemCellForRow(row);
  });
};

editToggle?.addEventListener("click", () => {
  if (!isAdminRole()) return;
  const isEditing = getEditableNodes()[0]?.isContentEditable;
  setEditingState(!isEditing);
});

saveEdits?.addEventListener("click", () => {
  if (!isAdminRole()) return;
  saveEditsToStorage();
  addAudit("Uloženy změny v účetnictví");
  setEditingState(false);
  renderAudit();
});

resetEdits?.addEventListener("click", () => {
  if (!isAdminRole()) return;
  localStorage.removeItem(EDITS_KEY);
  localStorage.removeItem(TX_KEY);
  if (firebaseEnabled) {
    firebaseStore.setDocValue(EDITS_KEY, {}).catch(() => {});
    firebaseStore.setDocValue(TX_KEY, []).catch(() => {});
  }
  addAudit("Reset účetnictví");
  window.location.reload();
});

const getAuditLogs = () => {
  const stored = localStorage.getItem(AUDIT_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(AUDIT_KEY);
    return [];
  }
};

const addAudit = (message) => {
  const logs = getAuditLogs();
  logs.unshift({ message, time: new Date().toISOString() });
  localStorage.setItem(AUDIT_KEY, JSON.stringify(logs.slice(0, 100)));
  if (firebaseEnabled) firebaseStore.setDocValue(AUDIT_KEY, logs.slice(0, 100)).catch(() => {});
  renderAudit();
};

function renderAudit() {
  if (auditList) {
    const logs = getAuditLogs();
    auditList.innerHTML = logs
      .map((log) => `<div class="audit-item"><span>${log.message}</span><small>${log.time}</small></div>`)
      .join("") || "<p class=\"muted\">Žádné záznamy.</p>";
    if (auditCount) auditCount.textContent = `${logs.length}`;
  }

  if (txCount) {
    const tx = localStorage.getItem(TX_KEY);
    try {
      const rows = JSON.parse(tx || "[]");
      txCount.textContent = `${Array.isArray(rows) ? rows.length : 0}`;
    } catch {
      txCount.textContent = "0";
    }
  }

  if (lastSave) {
    const logs = getAuditLogs();
    const save = logs.find((log) => log.message.includes("Uloženy"));
    lastSave.textContent = save ? save.time : "—";
  }
};

const parseAmount = (value) => {
  if (!value) return 0;
  const normalized = value
    .toString()
    .replace(/\$/g, "")
    .replace(/\s+/g, "")
    .replace(/,/g, "")
    .toLowerCase();
  const isNegative = normalized.includes("-");
  const numberPart = normalized.replace(/[^0-9.]/g, "");
  if (!numberPart) return 0;
  let amount = Number(numberPart);
  if (normalized.includes("k")) amount *= 1000;
  return isNegative ? -amount : amount;
};

const normalizeText = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const formatCurrency = (value) => {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}$ ${abs.toLocaleString("cs-CZ")}`;
};

const MENU_ITEMS = [
  "Casamigos",
  "Rum",
  "Whisky",
  "Tequila",
  "Brugal",
  "Gin",
  "Vodka",
  "Amaretto",
  "Pißwasser (tmavé)",
  "Pussywasser (svetlé)",
  "Pißwasser ICE (svetlé)",
  "Pißwasser NEIN (svetlé)",
  "Dusche Gold (12)",
  "Logger (11)",
  "Pißwasser (10)",
  "A.M Beer (11)",
  "Red Bull",
  "Pomarančový džus",
  "Brusinkový džus",
  "Ananasový džus",
  "Cola",
  "Cola Zero",
  "Soda",
  "Nachos",
  "Sendvič",
  "Arašídy",
  "Chipsy",
  "Preclíky",
];

const WORKSHOP_ITEMS = [
  "XXX 1",
  "XXX 2",
  "XXX 3",
  "XXX 4",
  "XXX 5",
];

const PRICE_LIST = {
  Casamigos: 250,
  Rum: 150,
  Whisky: 200,
  Tequila: 150,
  Brugal: 150,
  Gin: 150,
  Vodka: 150,
  Amaretto: 150,
  "Pißwasser (tmavé)": 80,
  "Pussywasser (svetlé)": 80,
  "Pißwasser ICE (svetlé)": 80,
  "Pißwasser NEIN (svetlé)": 80,
  "Dusche Gold (12)": 100,
  "Logger (11)": 100,
  "Pißwasser (10)": 100,
  "A.M Beer (11)": 100,
  "Red Bull": 90,
  "Pomarančový džus": 60,
  "Brusinkový džus": 60,
  "Ananasový džus": 60,
  Cola: 60,
  "Cola Zero": 50,
  Soda: 50,
  Nachos: 50,
  Sendvič: 100,
  Arašídy: 50,
  Chipsy: 50,
  Preclíky: 50,
};

const getPrice = (item) => PRICE_LIST[item] || 0;

const getSectionType = (sectionText) => {
  const normalized = sectionText?.toString().toLowerCase() || "";
  if (normalized.includes("bar")) return "bar";
  if (normalized.includes("díl") || normalized.includes("dil")) return "workshop";
  return "charter";
};

const getItemValueFromRow = (row) => {
  const itemCell = row?.children?.[4];
  const select = itemCell?.querySelector("[data-item-select]");
  const input = itemCell?.querySelector("[data-item-input]");
  return select?.value || input?.value || "";
};

const buildItemCellContent = (sectionType, itemValue, readOnly = false) => {
  if (sectionType === "charter") {
    const readonlyAttr = readOnly ? "readonly disabled" : "";
    return `<input class="item-input" type="text" data-item-input placeholder="Popis platby" value="${itemValue || ""}" ${readonlyAttr} />`;
  }
  const items = sectionType === "workshop" ? WORKSHOP_ITEMS : MENU_ITEMS;
  const options = ["—", ...items]
    .map((item) => {
      const selected = item === (itemValue || "—") ? "selected" : "";
      return `<option value="${item}" ${selected}>${item}</option>`;
    })
    .join("");
  const disabledAttr = readOnly ? "disabled" : "";
  return `<select class="item-select" data-item-select ${disabledAttr}>${options}</select>`;
};

const updateItemCellForRow = (row) => {
  if (!row) return;
  const sectionCell = row.children[2];
  const itemCell = row.children[4];
  if (!sectionCell || !itemCell) return;
  const readOnly = row.dataset.readonly === "true";
  const sectionType = getSectionType(sectionCell.textContent);
  const currentValue = getItemValueFromRow(row);
  itemCell.innerHTML = buildItemCellContent(sectionType, currentValue, readOnly);
};

updateRoleUI();

const updateModalItemControl = () => {
  if (!txSection) return;
  const sectionType = getSectionType(txSection.value || "");
  const showCharter = sectionType === "charter";
  if (txItemLabel) {
    txItemLabel.textContent = sectionType === "workshop" ? "Dílna položka" : "Menu item";
    txItemLabel.style.display = showCharter ? "none" : "block";
  }
  if (txItem) txItem.style.display = showCharter ? "none" : "block";
  if (txCharterLabel) txCharterLabel.style.display = showCharter ? "block" : "none";
  if (txCharterDesc) txCharterDesc.style.display = showCharter ? "block" : "none";
  if (txAmount) {
    txAmount.readOnly = !showCharter;
    if (showCharter && !txAmount.value) txAmount.value = "";
  }

  if (!showCharter && txItem) {
    const items = sectionType === "workshop" ? WORKSHOP_ITEMS : MENU_ITEMS;
    const current = txItem.value || "—";
    txItem.innerHTML = ["—", ...items]
      .map((item) => `<option value="${item}" ${item === current ? "selected" : ""}>${item}</option>`)
      .join("");
  }
};

const updateModalAmount = () => {
  if (!txAmount || !txQty || !txType || !txSection) return;
  const sectionType = getSectionType(txSection.value || "");
  if (sectionType === "charter") return;
  const qty = Number(txQty.value || 0);
  const price = getPrice(txItem?.value || "");
  const total = qty * price;
  const signed = txType.value === "Výdaj" ? -total : total;
  txAmount.value = formatCurrency(signed);
};

const getDeliveries = () => {
  const stored = localStorage.getItem(INVENTORY_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(INVENTORY_KEY);
    return [];
  }
};

const saveDeliveries = (deliveries) => {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(deliveries));
  if (firebaseEnabled) firebaseStore.setDocValue(INVENTORY_KEY, deliveries).catch(() => {});
};

const getAnnouncements = () => {
  const stored = localStorage.getItem(ANNOUNCEMENTS_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(ANNOUNCEMENTS_KEY);
    return [];
  }
};

const saveAnnouncementsToStorage = (items) => {
  localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(items));
  if (firebaseEnabled) firebaseStore.setDocValue(ANNOUNCEMENTS_KEY, items).catch(() => {});
};

const getGalleryItems = () => {
  const stored = localStorage.getItem(GALLERY_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(GALLERY_KEY);
    return [];
  }
};

const saveGalleryItemsToStorage = (items) => {
  localStorage.setItem(GALLERY_KEY, JSON.stringify(items));
  if (firebaseEnabled) firebaseStore.setDocValue(GALLERY_KEY, items).catch(() => {});
};

const renderGalleryPublic = () => {
  if (!galleryGrid) return;
  const items = getGalleryItems().filter((item) => item.active);
  galleryGrid.innerHTML = items.length
    ? items
        .map(
          (item) => `
            <article class="card">
              ${
                item.imageUrl
                  ? `<img class="gallery-image" src="${item.imageUrl}" alt="${item.title || "Galerie"}" />`
                  : ""
              }
              <h4>${item.title || "Galerie"}</h4>
              <p class="muted">${item.caption || ""}</p>
            </article>
          `
        )
        .join("")
    : "<p class=\"muted\">Zatím žádné fotky.</p>";
};

const renderGalleryAdmin = () => {
  if (!galleryAdminList) return;
  const items = getGalleryItems();
  galleryAdminList.innerHTML = items.length
    ? items
        .map(
          (item, index) => `
            <div class="announcement-admin-item" data-gallery-index="${index}">
              <label>Titulek</label>
              <input type="text" value="${item.title || ""}" data-field="title" />
              <label>URL obrázku</label>
              <input type="text" value="${item.imageUrl || ""}" data-field="imageUrl" />
              <label>Popisek</label>
              <input type="text" value="${item.caption || ""}" data-field="caption" />
              <label class="checkbox">
                <input type="checkbox" data-field="active" ${item.active ? "checked" : ""} /> Aktivní
              </label>
              <button class="btn btn--danger" type="button" data-action="delete">Smazat</button>
            </div>
          `
        )
        .join("")
    : "<p class=\"muted\">Zatím žádné položky.</p>";
};

const getBanner = () => {
  const stored = localStorage.getItem(BANNER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    localStorage.removeItem(BANNER_KEY);
    return null;
  }
};

const saveBannerToStorage = (banner) => {
  localStorage.setItem(BANNER_KEY, JSON.stringify(banner));
  if (firebaseEnabled) firebaseStore.setDocValue(BANNER_KEY, banner).catch(() => {});
};

const getRentalRequests = () => {
  const stored = localStorage.getItem(RENTAL_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(RENTAL_KEY);
    return [];
  }
};

const saveRentalRequests = (items) => {
  localStorage.setItem(RENTAL_KEY, JSON.stringify(items));
  if (firebaseEnabled) firebaseStore.setDocValue(RENTAL_KEY, items).catch(() => {});
};

const getRentalWebhook = () => {
  return localStorage.getItem(RENTAL_WEBHOOK_KEY) || "";
};

const saveRentalWebhook = (url) => {
  const trimmed = url?.trim() || "";
  if (trimmed) {
    localStorage.setItem(RENTAL_WEBHOOK_KEY, trimmed);
    if (firebaseEnabled) firebaseStore.setDocValue(RENTAL_WEBHOOK_KEY, trimmed).catch(() => {});
  } else {
    localStorage.removeItem(RENTAL_WEBHOOK_KEY);
    if (firebaseEnabled) firebaseStore.setDocValue(RENTAL_WEBHOOK_KEY, "").catch(() => {});
  }
};

const renderRentalRequests = () => {
  const requests = getRentalRequests();
  const pending = requests.filter((req) => req.status !== "done");
  const count = pending.length;
  if (rentalCount) rentalCount.textContent = String(count);
  if (rentalBadge) {
    rentalBadge.hidden = count === 0;
    rentalBadge.textContent = String(count);
  }

  if (rentalList) {
    rentalList.innerHTML = requests.length
      ? requests
          .map(
            (req) => `
              <div class="audit-item" data-rental-id="${req.id}">
                <span>
                  ${req.name || "(bez názvu)"} · ${req.date || "bez data"} · ${req.size || "?"} osob · ${req.contact || "bez kontaktu"}
                </span>
                <small>${req.notes || "Bez poznámky"}</small>
                <div class="announcement-actions" style="margin-top: 8px;">
                  <button class="btn btn--outline" type="button" data-action="resolve">Vyřídit</button>
                </div>
              </div>
            `
          )
          .join("")
      : "<p class=\"muted\">Žádné žádosti o pronájem.</p>";
  }
};

const sendRentalWebhook = async (request) => {
  const url = getRentalWebhook();
  if (!url) return;
  const payload = {
    content: "",
    embeds: [
      {
        title: "Nová žádost o pronájem",
        color: 12619602,
        fields: [
          { name: "Akce", value: request.name || "(bez názvu)", inline: false },
          { name: "Datum", value: request.date || "bez data", inline: true },
          { name: "Počet osob", value: String(request.size || "?"), inline: true },
          { name: "Kontakt", value: request.contact || "bez kontaktu", inline: false },
          { name: "Poznámka", value: request.notes || "Bez poznámky", inline: false },
        ],
        footer: { text: `Sons of Anarchy · ${new Date(request.createdAt).toLocaleString("cs-CZ")}` },
      },
    ],
  };
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // ignore webhook errors
  }
};

const seedBanner = () => {
  const existing = getBanner();
  if (existing) return;
  saveBannerToStorage({
    title: "OZNÁMENÍ",
    message: "Aktuality z klubu budou brzy doplněny.",
    active: true,
  });
};

const renderBanner = () => {
  if (!topNotice) return;
  seedBanner();
  const banner = getBanner();
  const bannerDismissed = localStorage.getItem("soa_notice_hidden") === "true";
  if (banner && banner.active && !bannerDismissed) {
    topNotice.hidden = false;
    if (topNoticeTitle) topNoticeTitle.textContent = banner.title || "OZNÁMENÍ";
    if (topNoticeMessage) topNoticeMessage.textContent = banner.message || "";
  } else {
    topNotice.hidden = true;
  }
};

const loadBannerForm = () => {
  if (!bannerTitle || !bannerMessage) return;
  seedBanner();
  const banner = getBanner();
  if (!banner) return;
  bannerTitle.value = banner.title || "OZNÁMENÍ";
  bannerMessage.value = banner.message || "";
  if (bannerActive) bannerActive.checked = Boolean(banner.active);
};

const seedAnnouncements = () => {
  const existing = getAnnouncements();
  if (existing.length) return;
  const seeded = [
    {
      title: "OZNÁMENÍ",
      message: "Clubhouse je otevřen pro členy každý den od 18:00.",
      active: true,
    },
  ];
  saveAnnouncementsToStorage(seeded);
};

const renderAnnouncementsPublic = () => {
  seedAnnouncements();
  const allItems = getAnnouncements();
  const items = allItems
    .map((item, index) => (item.active ? { ...item, _index: index } : null))
    .filter(Boolean);
  const role = sessionStorage.getItem(ROLE_KEY);
  if (announcementList) {
    announcementList.innerHTML = items.length
      ? items
          .map(
            (item) => `
              <article class="announcement-card" data-announcement-index="${item._index}">
                <h4>${item.title}</h4>
                <p class="muted">${item.message}</p>
                ${
                  role === "admin"
                    ? `<div class="announcement-actions" style="margin-top: 10px;">
                        <button class="btn btn--outline" type="button" data-action="edit">Upravit</button>
                        <button class="btn btn--danger" type="button" data-action="delete">Smazat</button>
                      </div>`
                    : ""
                }
              </article>
            `
          )
          .join("")
      : "<p class=\"muted\">Momentálně žádná oznámení.</p>";
  }

  renderBanner();
};

const renderAnnouncementsAdmin = () => {
  if (!announcementAdminList) return;
  const items = getAnnouncements();
    announcementAdminList.innerHTML = items.length
    ? items
        .map(
          (item, index) => `
            <div class="announcement-admin-item" data-announcement-index="${index}">
              <input type="text" value="${item.title}" placeholder="Titulek" data-field="title" />
              <input type="text" value="${item.message}" placeholder="Text" data-field="message" />
              <label class="checkbox">
                <input type="checkbox" data-field="active" ${item.active ? "checked" : ""} /> Aktivní
              </label>
            </div>
          `
        )
        .join("")
    : "<p class=\"muted\">Zatím žádná oznámení.</p>";
};

const recalcTotals = () => {
  if (!transactionBody) return;
  let income = 0;
  let expenses = 0;
  const sections = {
    bar: { income: 0, expenses: 0 },
    workshop: { income: 0, expenses: 0 },
    charter: { income: 0, expenses: 0 },
  };
  const earners = new Map();
  const rows = Array.from(transactionBody.querySelectorAll("tr"));
  const sold = new Map();
  rows.forEach((row) => {
    const sectionCell = row.children[2];
    const typeCell = row.children[3];
    const itemCell = row.children[4];
    const qtyCell = row.children[5];
    const amountCell = row.children[6];
    const enteredCell = row.children[7];

    const sectionText = sectionCell?.textContent?.toLowerCase() || "";
    const typeText = typeCell?.textContent || "";
    const amountValue = parseAmount(amountCell?.textContent || "");
    const enteredBy = enteredCell?.textContent?.trim() || "Neznámý";
    const itemSelect = itemCell?.querySelector("[data-item-select]");
    const itemInput = itemCell?.querySelector("[data-item-input]");
    const qtyInput = qtyCell?.querySelector("[data-qty-input]");
    const itemValue = itemSelect?.value || itemInput?.value || "—";
    const qtyValue = Number(qtyInput?.value || 0);

    const normalizedType = normalizeText(typeText);
    const isExplicitExpense = normalizedType.includes("vydaj");
    const isExplicitIncome = normalizedType.includes("prijem");
    const isIncome = isExplicitIncome || (!isExplicitExpense && amountValue > 0);
    const isExpense = isExplicitExpense || (!isExplicitIncome && amountValue < 0);
    const normalizedSection = getSectionType(sectionText);

    if (isIncome) {
      income += Math.abs(amountValue);
      sections[normalizedSection].income += Math.abs(amountValue);
      earners.set(enteredBy, (earners.get(enteredBy) || 0) + Math.abs(amountValue));
      if (normalizedSection === "bar" && MENU_ITEMS.includes(itemValue) && qtyValue > 0) {
        sold.set(itemValue, (sold.get(itemValue) || 0) + qtyValue);
      }
    } else if (isExpense) {
      expenses += Math.abs(amountValue);
      sections[normalizedSection].expenses += Math.abs(amountValue);
    }
  });
  if (totalIncome) totalIncome.textContent = formatCurrency(income);
  if (totalExpenses) totalExpenses.textContent = formatCurrency(expenses);
  if (totalReserve) totalReserve.textContent = formatCurrency(income - expenses);

  if (barIncome) barIncome.textContent = formatCurrency(sections.bar.income);
  if (barExpenses) barExpenses.textContent = formatCurrency(sections.bar.expenses);
  if (barNet) barNet.textContent = formatCurrency(sections.bar.income - sections.bar.expenses);

  if (workshopIncome) workshopIncome.textContent = formatCurrency(sections.workshop.income);
  if (workshopExpenses) workshopExpenses.textContent = formatCurrency(sections.workshop.expenses);
  if (workshopNet) workshopNet.textContent = formatCurrency(sections.workshop.income - sections.workshop.expenses);

  if (charterIncome) charterIncome.textContent = formatCurrency(sections.charter.income);
  if (charterExpenses) charterExpenses.textContent = formatCurrency(sections.charter.expenses);
  if (charterNet) charterNet.textContent = formatCurrency(sections.charter.income - sections.charter.expenses);

  const maxFlow = Math.max(income, expenses, Math.abs(income - expenses), 1);
  if (flowIncome) flowIncome.style.width = `${(income / maxFlow) * 100}%`;
  if (flowExpenses) flowExpenses.style.width = `${(expenses / maxFlow) * 100}%`;
  if (flowNet) flowNet.style.width = `${(Math.abs(income - expenses) / maxFlow) * 100}%`;

  const sortedEarners = Array.from(earners.entries()).sort((a, b) => b[1] - a[1]);
  const top = sortedEarners[0];
  if (topEarnerName) topEarnerName.textContent = top ? top[0] : "—";
  if (topEarnerAmount) topEarnerAmount.textContent = top ? formatCurrency(top[1]) : "$ 0";
  if (topEarners) {
    topEarners.innerHTML = sortedEarners.length
      ? sortedEarners
          .slice(0, 5)
          .map(
            ([name, amount]) => `
              <div class="audit-item">
                <span>${name}</span>
                <small>${formatCurrency(amount)}</small>
              </div>
            `
          )
          .join("")
      : "<p class=\"muted\">Žádná data.</p>";
  }

  renderInventory(sold);
};

const renderInventory = (soldMap = new Map()) => {
  if (!inventoryBody) return;
  const deliveries = getDeliveries();
  const deliveredTotals = MENU_ITEMS.reduce((acc, item) => {
    acc[item] = 0;
    return acc;
  }, {});

  deliveries.forEach((entry) => {
    if (deliveredTotals[entry.item] !== undefined) {
      deliveredTotals[entry.item] += Number(entry.qty || 0);
    }
  });
  const lowStock = [];
  const outOfStock = [];

  inventoryBody.innerHTML = MENU_ITEMS.map((item) => {
    const delivered = deliveredTotals[item] || 0;
    const sold = soldMap.get(item) || 0;
    const currentRaw = delivered - sold;
    const current = Math.max(0, currentRaw);
    if (currentRaw <= 0) outOfStock.push(item);
    if (currentRaw > 0 && currentRaw <= 5) lowStock.push({ item, current: currentRaw });
    return `
      <tr>
        <td>${item}</td>
        <td>${delivered}</td>
        <td>${sold}</td>
        <td><strong>${current}</strong></td>
      </tr>
    `;
  }).join("");

  const existingAlerts = document.getElementById("inventoryAlerts");
  if (existingAlerts) {
    const lowItems = lowStock
      .map((entry) => `<div class="alert-item">${entry.item} · ${entry.current} ks</div>`)
      .join("");
    const outItems = outOfStock.map((item) => `<div class="alert-item">${item}</div>`).join("");
    existingAlerts.innerHTML = `
      <div class="alert alert--warn">
        <strong>Nízký stav</strong>
        ${lowItems || "<span class=\"muted\">Vše v normě</span>"}
      </div>
      <div class="alert alert--danger">
        <strong>Vyprodáno</strong>
        ${outItems || "<span class=\"muted\">Žádné položky</span>"}
      </div>
    `;
  }
};

function getDebts() {
  const stored = localStorage.getItem(DEBTS_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(DEBTS_KEY);
    return [];
  }
}

function saveDebts(items) {
  localStorage.setItem(DEBTS_KEY, JSON.stringify(items));
  if (firebaseEnabled) firebaseStore.setDocValue(DEBTS_KEY, items).catch(() => {});
}

const getDebtLabel = (type) => (type === "receivable" ? "Dluží nám" : "Naše dluhy");
const getDebtPillClass = (type) =>
  type === "receivable" ? "debt-pill debt-pill--receivable" : "debt-pill debt-pill--owed";
const getDebtStatusLabel = (status) => (status === "paid" ? "Splaceno" : "Aktivní");
const getDebtStatusClass = (status) =>
  status === "paid" ? "debt-pill debt-status--paid" : "debt-pill debt-status--open";

const updateDebtTotals = (items) => {
  if (!debtTotalOwed && !debtTotalReceivable && !debtTotalNet) return;
  let owed = 0;
  let receivable = 0;
  items.forEach((item) => {
    const principal = Number(item.principal || 0);
    const interest = Number(item.interestAmount || 0);
    const total = principal + interest;
    if (item.status === "paid") return;
    if (item.type === "receivable") receivable += total;
    else owed += total;
  });
  if (debtTotalOwed) debtTotalOwed.textContent = formatCurrency(owed);
  if (debtTotalReceivable) debtTotalReceivable.textContent = formatCurrency(receivable);
  if (debtTotalNet) debtTotalNet.textContent = formatCurrency(receivable - owed);
};

function renderDebts(readOnly = false) {
  if (!debtTableBody) return;
  const items = getDebts();
  if (!items.length) {
    debtTableBody.innerHTML =
      "<tr><td colspan=\"11\" class=\"muted\">Zatím žádné dluhy.</td></tr>";
    updateDebtTotals(items);
    return;
  }
  debtTableBody.innerHTML = items
    .map((item, index) => {
      const principal = Number(item.principal || 0);
      const interest = Number(item.interestAmount || 0);
      const total = principal + interest;
      const interestLabel = item.interestRate
        ? `${item.interestRate}% · ${formatCurrency(interest)}`
        : formatCurrency(interest);
      const actions = readOnly
        ? "<span class=\"muted\">—</span>"
        : `
          <div class=\"table-actions\">
            <button class=\"btn btn--outline btn--xs\" type=\"button\" data-action=\"edit\">Upravit</button>
            <button class=\"btn btn--danger btn--xs\" type=\"button\" data-action=\"delete\">Smazat</button>
          </div>
        `;
      return `
        <tr data-debt-index="${index}">
          <td><span class="${getDebtPillClass(item.type)}">${getDebtLabel(item.type)}</span></td>
          <td>${item.person || "—"}</td>
          <td>${item.reason || "—"}</td>
          <td>${formatCurrency(principal)}</td>
          <td>${interestLabel}</td>
          <td><strong>${formatCurrency(total)}</strong></td>
          <td>${item.startDate || "—"}</td>
          <td>${item.dueDate || "—"}</td>
          <td><span class="${getDebtStatusClass(item.status)}">${getDebtStatusLabel(item.status)}</span></td>
          <td>${item.note || "—"}</td>
          <td>${actions}</td>
        </tr>
      `;
    })
    .join("");
  updateDebtTotals(items);
}

const updateDebtTotalPreview = () => {
  if (!debtPrincipal || !debtInterestRate || !debtInterestAmount || !debtTotal) return;
  const principal = Number(debtPrincipal.value || 0);
  const rate = Number(debtInterestRate.value || 0);
  let interest = Number(debtInterestAmount.value || 0);
  if (rate > 0) {
    interest = Math.round((principal * rate) / 100);
    debtInterestAmount.value = String(interest);
  }
  debtTotal.value = formatCurrency(principal + interest);
};

const openDebtModal = (item = null, index = null) => {
  if (!debtModal) return;
  debtModal.classList.add("show");
  debtModal.setAttribute("aria-hidden", "false");
  if (debtTitle) debtTitle.textContent = item ? "Upravit dluh" : "Nový dluh";
  if (debtForm) {
    if (index !== null && index !== undefined) debtForm.dataset.editIndex = String(index);
    else delete debtForm.dataset.editIndex;
  }
  if (!item) {
    if (debtType) debtType.value = "owed";
    if (debtPerson) debtPerson.value = "";
    if (debtReason) debtReason.value = "";
    if (debtPrincipal) debtPrincipal.value = "";
    if (debtInterestRate) debtInterestRate.value = "";
    if (debtInterestAmount) debtInterestAmount.value = "";
    if (debtStartDate) debtStartDate.value = new Date().toISOString().slice(0, 10);
    if (debtDueDate) debtDueDate.value = "";
    if (debtStatus) debtStatus.value = "open";
    if (debtNote) debtNote.value = "";
  } else {
    if (debtType) debtType.value = item.type || "owed";
    if (debtPerson) debtPerson.value = item.person || "";
    if (debtReason) debtReason.value = item.reason || "";
    if (debtPrincipal) debtPrincipal.value = String(item.principal || "");
    if (debtInterestRate) debtInterestRate.value = String(item.interestRate || "");
    if (debtInterestAmount) debtInterestAmount.value = String(item.interestAmount || "");
    if (debtStartDate) debtStartDate.value = item.startDate || "";
    if (debtDueDate) debtDueDate.value = item.dueDate || "";
    if (debtStatus) debtStatus.value = item.status || "open";
    if (debtNote) debtNote.value = item.note || "";
  }
  updateDebtTotalPreview();
  debtPerson?.focus();
};

const closeDebtModal = () => {
  if (!debtModal) return;
  debtModal.classList.remove("show");
  debtModal.setAttribute("aria-hidden", "true");
};


const updateRowAmount = (row) => {
  if (!row) return;
  const typeCell = row.children[3];
  const itemCell = row.children[4];
  const qtyCell = row.children[5];
  const amountCell = row.children[6];
  const itemSelect = itemCell?.querySelector("[data-item-select]");
  const qtyInput = qtyCell?.querySelector("[data-qty-input]");
  if (!itemSelect || !qtyInput || !amountCell) return;
  const sectionCell = row.children[2];
  const sectionType = getSectionType(sectionCell?.textContent || "");
  if (sectionType === "charter") return;
  const price = getPrice(itemSelect.value);
  const qty = Number(qtyInput.value || 0);
  const total = qty * price;
  const typeText = typeCell?.textContent || "";
  const isExpense = normalizeText(typeText).includes("vydaj");
  const signed = isExpense ? -total : total;
  amountCell.textContent = formatCurrency(signed);
};

transactionBody?.addEventListener("input", (event) => {
  if (!isAdminRole()) return;
  const row = event.target.closest("tr");
  if (event.target.matches("[data-editable-key$='-section']")) {
    updateItemCellForRow(row);
  }
  if (event.target.matches("[data-qty-input], [data-item-select]")) {
    updateRowAmount(row);
  }
  recalcTotals();
});

transactionBody?.addEventListener("change", (event) => {
  if (!isAdminRole()) return;
  const row = event.target.closest("tr");
  if (event.target.matches("[data-editable-key$='-section']")) {
    updateItemCellForRow(row);
  }
  if (event.target.matches("[data-qty-input], [data-item-select]")) {
    updateRowAmount(row);
  }
  recalcTotals();
});

addTransaction?.addEventListener("click", () => {
  if (!transactionModal) return;
  transactionModal.classList.add("show");
  transactionModal.setAttribute("aria-hidden", "false");
  if (txDate) txDate.value = new Date().toISOString().slice(0, 10);
  if (txSection) txSection.value = "Bar";
  if (txType) txType.value = "Příjem";
  if (txDesc) txDesc.value = "";
  if (txItem) txItem.value = "—";
  if (txCharterDesc) txCharterDesc.value = "";
  if (txQty) txQty.value = "1";
  if (txEntered) txEntered.value = "";
  if (txApprove) txApprove.value = "";
  updateModalItemControl();
  updateModalAmount();
});

closeTransaction?.addEventListener("click", () => {
  transactionModal?.classList.remove("show");
  transactionModal?.setAttribute("aria-hidden", "true");
});

transactionModal?.addEventListener("click", (event) => {
  if (event.target === transactionModal) {
    transactionModal.classList.remove("show");
    transactionModal.setAttribute("aria-hidden", "true");
  }
});

[txType, txItem, txQty].forEach((el) => el?.addEventListener("input", updateModalAmount));
txSection?.addEventListener("change", () => {
  updateModalItemControl();
  updateModalAmount();
});

transactionForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!transactionBody) return;
  if (!getCurrentRole()) return;
  const id = `t${Date.now()}`;
  const sectionValue = txSection?.value || "Charter";
  const sectionType = getSectionType(sectionValue);
  const itemValue = sectionType === "charter" ? txCharterDesc?.value?.trim() || "" : txItem?.value || "—";
  const price = getPrice(txItem?.value || "");
  const qty = Number(txQty?.value || 0);
  const total = qty * price;
  const signed = txType?.value === "Výdaj" ? -total : total;
  const amountText = sectionType === "charter"
    ? (txAmount?.value?.trim() || "")
    : formatCurrency(signed);

  const roleName = sessionStorage.getItem(ROLE_NAME_KEY) || (isAdminRole() ? "Admin" : "Člen");
  const transaction = {
    date: txDate?.value || "",
    desc: txDesc?.value || "",
    section: sectionValue,
    type: txType?.value || "Příjem",
    item: itemValue || "—",
    qty,
    amount: amountText,
    enteredBy: txEntered?.value || roleName,
    approve: txApprove?.value || (isAdminRole() ? roleName : "—"),
  };

  const existing = getStoredTransactions();
  existing.unshift(transaction);
  saveTransactions(existing);

  const row = buildTransactionRow(transaction, !isAdminRole(), 0);
  transactionBody.prepend(row);
  updateItemCellForRow(row);

  if (isAdminRole()) setEditingState(true);
  addAudit("Přidána nová transakce");
  recalcTotals();
  transactionModal?.classList.remove("show");
  transactionModal?.setAttribute("aria-hidden", "true");
});

addDebt?.addEventListener("click", () => {
  if (!isAdminRole()) {
    showRoleModal();
    return;
  }
  openDebtModal();
});

closeDebt?.addEventListener("click", closeDebtModal);

debtModal?.addEventListener("click", (event) => {
  if (event.target === debtModal) closeDebtModal();
});

[debtPrincipal, debtInterestRate, debtInterestAmount].forEach((el) =>
  el?.addEventListener("input", updateDebtTotalPreview)
);

debtForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!debtPerson) return;
  if (!isAdminRole()) return;
  if (!debtPerson.value.trim()) return;
  const items = getDebts();
  const principal = Number(debtPrincipal?.value || 0);
  const rate = Number(debtInterestRate?.value || 0);
  const interestAmount = Number(debtInterestAmount?.value || 0);
  const payload = {
    type: debtType?.value || "owed",
    person: debtPerson.value.trim(),
    reason: debtReason?.value.trim() || "",
    principal,
    interestRate: rate,
    interestAmount,
    startDate: debtStartDate?.value || "",
    dueDate: debtDueDate?.value || "",
    status: debtStatus?.value || "open",
    note: debtNote?.value.trim() || "",
    updatedAt: new Date().toISOString(),
  };
  const editIndex = debtForm?.dataset.editIndex;
  if (editIndex) {
    const index = Number(editIndex);
    if (!Number.isNaN(index) && items[index]) {
      items[index] = { ...items[index], ...payload };
    }
  } else {
    items.unshift({ ...payload, createdAt: new Date().toISOString() });
  }
  saveDebts(items);
  renderDebts(!isAdminRole());
  addAudit(editIndex ? "Upraven dluh" : "Přidán dluh");
  closeDebtModal();
});

debtTableBody?.addEventListener("click", (event) => {
  if (!isAdminRole()) return;
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const row = button.closest("[data-debt-index]");
  if (!row) return;
  const index = Number(row.dataset.debtIndex || "-1");
  if (Number.isNaN(index) || index < 0) return;
  const items = getDebts();
  const selected = items[index];
  if (!selected) return;
  if (button.dataset.action === "edit") {
    openDebtModal(selected, index);
    return;
  }
  if (button.dataset.action === "delete") {
    const updated = items.filter((_, itemIndex) => itemIndex !== index);
    saveDebts(updated);
    renderDebts(!isAdminRole());
    addAudit("Smazán dluh");
  }
});

recalcTotals();

addInventory?.addEventListener("click", () => {
  if (!inventoryItem || !inventoryQty) return;
  const qty = Number(inventoryQty.value || 0);
  if (!qty || qty <= 0) return;
  const deliveries = getDeliveries();
  deliveries.unshift({
    item: inventoryItem.value,
    qty,
    date: inventoryDate?.value || new Date().toISOString().slice(0, 10),
  });
  saveDeliveries(deliveries);
  addAudit(`Dodávka na sklad: ${inventoryItem.value} (${qty} ks)`);
  renderInventory();
});

const closeAnnouncementModalHandler = () => {
  if (!announcementModal) return;
  announcementModal.classList.remove("show");
  announcementModal.setAttribute("aria-hidden", "true");
};

const openAnnouncementModalHandler = (reset = true) => {
  if (!announcementModal) return;
  announcementModal.classList.add("show");
  announcementModal.setAttribute("aria-hidden", "false");
  if (reset) {
    if (announcementTitle) announcementTitle.value = "";
    if (announcementMessage) announcementMessage.value = "";
    if (announcementActive) announcementActive.checked = true;
    if (announcementForm?.dataset.editIndex) delete announcementForm.dataset.editIndex;
  }
  announcementTitle?.focus();
};

openAnnouncementModal?.addEventListener("click", openAnnouncementModalHandler);
closeAnnouncementModal?.addEventListener("click", closeAnnouncementModalHandler);
announcementModal?.addEventListener("click", (event) => {
  if (event.target === announcementModal) closeAnnouncementModalHandler();
});

announcementForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!announcementTitle || !announcementMessage) return;
  const title = announcementTitle.value.trim();
  const message = announcementMessage.value.trim();
  if (!title || !message) return;
  const items = getAnnouncements();
  const editIndex = announcementForm?.dataset.editIndex;
  if (editIndex) {
    const index = Number(editIndex);
    if (!Number.isNaN(index) && items[index]) {
      items[index] = {
        ...items[index],
        title,
        message,
        active: announcementActive?.checked ?? true,
      };
    }
  } else {
    items.unshift({
      title,
      message,
      active: announcementActive?.checked ?? true,
    });
  }
  saveAnnouncementsToStorage(items);
  announcementTitle.value = "";
  announcementMessage.value = "";
  if (announcementActive) announcementActive.checked = true;
  if (announcementForm?.dataset.editIndex) delete announcementForm.dataset.editIndex;
  renderAnnouncementsAdmin();
  renderAnnouncementsPublic();
  addAudit(editIndex ? "Upravena aktualita" : "Přidáno oznámení");
  closeAnnouncementModalHandler();
});

saveAnnouncements?.addEventListener("click", () => {
  if (!announcementAdminList) return;
  const items = Array.from(announcementAdminList.querySelectorAll("[data-announcement-index]")).map(
    (row) => {
      const titleInput = row.querySelector("[data-field='title']");
      const messageInput = row.querySelector("[data-field='message']");
      const activeInput = row.querySelector("[data-field='active']");
      return {
        title: titleInput?.value.trim() || "",
        message: messageInput?.value.trim() || "",
        active: Boolean(activeInput?.checked),
      };
    }
  );
  saveAnnouncementsToStorage(items.filter((item) => item.title || item.message));
  renderAnnouncementsAdmin();
  renderAnnouncementsPublic();
  addAudit("Uložena oznámení");
});

galleryForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!galleryTitle || !galleryImageUrl) return;
  const title = galleryTitle.value.trim();
  const imageUrl = galleryImageUrl.value.trim();
  const caption = galleryCaption?.value.trim() || "";
  if (!title && !imageUrl && !caption) return;
  const items = getGalleryItems();
  const editIndex = galleryForm?.dataset.editIndex;
  const payload = {
    title,
    imageUrl,
    caption,
    active: galleryActive?.checked ?? true,
  };
  if (editIndex) {
    const index = Number(editIndex);
    if (!Number.isNaN(index) && items[index]) {
      items[index] = { ...items[index], ...payload };
    }
  } else {
    items.unshift(payload);
  }
  saveGalleryItemsToStorage(items);
  galleryTitle.value = "";
  galleryImageUrl.value = "";
  if (galleryCaption) galleryCaption.value = "";
  if (galleryActive) galleryActive.checked = true;
  if (galleryForm?.dataset.editIndex) delete galleryForm.dataset.editIndex;
  renderGalleryAdmin();
  renderGalleryPublic();
  addAudit(editIndex ? "Upravena galerie" : "Přidána fotka do galerie");
});

saveGallery?.addEventListener("click", () => {
  if (!galleryAdminList) return;
  const items = Array.from(galleryAdminList.querySelectorAll("[data-gallery-index]")).map(
    (row) => {
      const title = row.querySelector("[data-field='title']")?.value.trim() || "";
      const imageUrl = row.querySelector("[data-field='imageUrl']")?.value.trim() || "";
      const caption = row.querySelector("[data-field='caption']")?.value.trim() || "";
      const active = Boolean(row.querySelector("[data-field='active']")?.checked);
      return { title, imageUrl, caption, active };
    }
  );
  saveGalleryItemsToStorage(items.filter((item) => item.title || item.imageUrl || item.caption));
  renderGalleryAdmin();
  renderGalleryPublic();
  addAudit("Uložena galerie");
});

galleryAdminList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action='delete']");
  if (!button) return;
  const row = button.closest("[data-gallery-index]");
  if (!row) return;
  row.remove();
  saveGallery?.click();
});

announcementList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const card = button.closest("[data-announcement-index]");
  if (!card) return;
  const index = Number(card.dataset.announcementIndex || "-1");
  if (Number.isNaN(index) || index < 0) return;
  const items = getAnnouncements();
  const selected = items[index];
  if (!selected) return;

  if (button.dataset.action === "edit") {
    if (!announcementTitle || !announcementMessage) return;
    if (announcementForm) announcementForm.dataset.editIndex = String(index);
    openAnnouncementModalHandler(false);
    announcementTitle.value = selected.title || "";
    announcementMessage.value = selected.message || "";
    if (announcementActive) announcementActive.checked = Boolean(selected.active);
    return;
  }

  if (button.dataset.action === "delete") {
    const updated = items.filter((_, itemIndex) => itemIndex !== index);
    saveAnnouncementsToStorage(updated);
    renderAnnouncementsAdmin();
    renderAnnouncementsPublic();
    addAudit("Smazána aktualita");
  }
});

saveBanner?.addEventListener("click", () => {
  if (!bannerTitle || !bannerMessage) return;
  const payload = {
    title: bannerTitle.value.trim() || "OZNÁMENÍ",
    message: bannerMessage.value.trim() || "",
    active: Boolean(bannerActive?.checked),
  };
  saveBannerToStorage(payload);
  localStorage.removeItem("soa_notice_hidden");
  renderBanner();
  addAudit("Uloženo oznámení v liště");
});

saveRentalWebhookButton?.addEventListener("click", () => {
  const url = rentalWebhook?.value || "";
  saveRentalWebhook(url);
  if (rentalWebhook) rentalWebhook.value = getRentalWebhook();
  addAudit("Uložen Discord webhook pro pronájmy");
});

rentalForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!eventName || !eventDate || !eventSize || !eventContact) return;
  const name = eventName.value.trim();
  const date = eventDate.value;
  const size = Number(eventSize.value || 0);
  const contact = eventContact.value.trim();
  const notes = eventNotes?.value.trim() || "";

  if (!name || !date || !size || !contact) {
    if (rentalStatus) rentalStatus.textContent = "Vyplň název, datum, počet osob a kontakt.";
    return;
  }

  const request = {
    id: `r${Date.now()}`,
    name,
    date,
    size,
    contact,
    notes,
    status: "new",
    createdAt: new Date().toISOString(),
  };

  const existing = getRentalRequests();
  existing.unshift(request);
  saveRentalRequests(existing);
  renderRentalRequests();
  sendRentalWebhook(request);
  addAudit("Nová žádost o pronájem");

  eventName.value = "";
  eventDate.value = "";
  eventSize.value = "";
  eventContact.value = "";
  if (eventNotes) eventNotes.value = "";
  if (rentalStatus) rentalStatus.textContent = "Žádost byla odeslaná. Ozveme se.";
});

closeNotice?.addEventListener("click", () => {
  localStorage.setItem("soa_notice_hidden", "true");
  if (topNotice) topNotice.hidden = true;
});

function getAccounts() {
  const stored = localStorage.getItem(ACCOUNTS_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    const isAccountLike = (value) =>
      value &&
      typeof value === "object" &&
      ("name" in value || "role" in value || "password" in value || "email" in value);
    const asArray = (value) => (Array.isArray(value) ? value : []);
    const asValues = (value) => (value && typeof value === "object" ? Object.values(value) : []);

    if (Array.isArray(parsed)) return parsed;

    if (parsed && typeof parsed === "object") {
      if (Array.isArray(parsed.items)) return parsed.items;
      if (Array.isArray(parsed.accounts)) return parsed.accounts;
      if (Array.isArray(parsed.value)) return parsed.value;
      if (Array.isArray(parsed.data)) return parsed.data;
      if (Array.isArray(parsed.list)) return parsed.list;
      if (Array.isArray(parsed.users)) return parsed.users;

      if (parsed.value && typeof parsed.value === "object") {
        const nestedValues = asValues(parsed.value);
        if (nestedValues.every(isAccountLike)) return nestedValues;
      }

      const values = asValues(parsed);
      if (values.every(isAccountLike)) return values;
      const arrayCandidate = values.find((value) => Array.isArray(value) && value.every(isAccountLike));
      if (arrayCandidate) return arrayCandidate;
    }

    return [];
  } catch {
    localStorage.removeItem(ACCOUNTS_KEY);
    return [];
  }
}

const saveAccounts = (items) => {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(items));
  if (firebaseEnabled) firebaseStore.setDocValue(ACCOUNTS_KEY, items).catch(() => {});
};

const renderAccounts = () => {
  const items = getAccounts();
  if (accountList) {
    accountList.innerHTML = items.length
      ? items
          .map(
            (item, index) => `
              <div class="announcement-admin-item" data-account-index="${index}">
                <label>Jméno</label>
                <input type="text" value="${item.name}" data-field="name" />
                <label>E-mail</label>
                <input type="email" value="${item.email || ""}" data-field="email" />
                <label>Role</label>
                <select data-field="role">
                  <option value="member" ${item.role === "member" ? "selected" : ""}>Člen</option>
                  <option value="admin" ${item.role === "admin" ? "selected" : ""}>Admin</option>
                </select>
                <label>Aktivita</label>
                <input type="text" value="${item.activity || ""}" data-field="activity" />
                <label>Heslo</label>
                <input type="text" value="${item.password}" data-field="password" />
                <label>Poznámka</label>
                <input type="text" value="${item.note || ""}" data-field="note" />
                <button class="btn btn--danger" type="button" data-action="delete">Smazat účet</button>
              </div>
            `
          )
          .join("")
      : "<p class=\"muted\">Zatím žádné účty.</p>";
  }

  if (accountListDetailed) {
    accountListDetailed.innerHTML = items.length
      ? items
          .map(
            (item, index) => `
              <details class="account-item" data-account-index="${index}">
                <summary>
                  <div class="account-meta">
                    <span class="account-title">${item.name || "Neznámý"}</span>
                    <span class="account-pill">${item.role || "member"}</span>
                  </div>
                  <small class="muted">${item.activity || "Bez aktivity"}</small>
                </summary>
                <div class="account-body">
                  <label>Jméno</label>
                  <input type="text" value="${item.name}" data-field="name" />
                  <label>E-mail</label>
                  <input type="email" value="${item.email || ""}" data-field="email" />
                  <label>Role</label>
                  <select data-field="role">
                    <option value="member" ${item.role === "member" ? "selected" : ""}>Člen</option>
                    <option value="admin" ${item.role === "admin" ? "selected" : ""}>Admin</option>
                  </select>
                  <label>Aktivita</label>
                  <input type="text" value="${item.activity || ""}" data-field="activity" />
                  <label>Heslo</label>
                  <input type="text" value="${item.password}" data-field="password" />
                  <label>Poznámka</label>
                  <input type="text" value="${item.note || ""}" data-field="note" />
                  <div class="account-actions">
                    <button class="btn btn--danger" type="button" data-action="delete">Smazat účet</button>
                    <span class="muted">Nezapomeň uložit změny.</span>
                  </div>
                </div>
              </details>
            `
          )
          .join("")
      : "<p class=\"muted\">Zatím žádné účty.</p>";
  }
};

createAccount?.addEventListener("click", () => {
  if (!accountName || !accountRole || !accountPassword) return;
  const name = accountName.value.trim();
  const role = accountRole.value;
  const activity = accountActivity?.value.trim() || "Active";
  const email = accountEmail?.value.trim() || "";
  const password = accountPassword.value.trim();
  const note = accountNote?.value.trim() || "";
  if (!name || !password) return;
  if (authEnabled && !email) {
    alert("Zadej e-mail pro Firebase Auth účet.");
    return;
  }
  const items = getAccounts();
  const proceed = async () => {
    items.unshift({ name, role, activity, email, password, note });
    saveAccounts(items);
    accountName.value = "";
    if (accountEmail) accountEmail.value = "";
    if (accountActivity) accountActivity.value = "";
    accountPassword.value = "";
    if (accountNote) accountNote.value = "";
    renderAccounts();
    addAudit("Vytvořen účet");
  };

  if (authEnabled) {
    const confirmCreate = window.confirm(
      "Vytvoření účtu ve Firebase Auth tě dočasně odhlásí. Po vytvoření se znovu přihlas jako admin. Pokračovat?"
    );
    if (!confirmCreate) return;
    firebaseAuth
      .signUp(email, password)
      .then(() => firebaseAuth.signOut().catch(() => {}))
      .then(proceed)
      .catch(() => alert("Nepodařilo se vytvořit Firebase Auth účet."));
    return;
  }

  items.unshift({ name, role, activity, email, password, note });
  saveAccounts(items);
  accountName.value = "";
  if (accountEmail) accountEmail.value = "";
  if (accountActivity) accountActivity.value = "";
  accountPassword.value = "";
  if (accountNote) accountNote.value = "";
  renderAccounts();
  addAudit("Vytvořen účet");
});

saveAccountsButton?.addEventListener("click", () => {
  const source = accountListDetailed || accountList;
  if (!source) return;
  const items = Array.from(source.querySelectorAll("[data-account-index]")).map((row) => {
    const name = row.querySelector("[data-field='name']")?.value.trim() || "";
    const email = row.querySelector("[data-field='email']")?.value.trim() || "";
    const role = row.querySelector("[data-field='role']")?.value || "member";
    const activity = row.querySelector("[data-field='activity']")?.value.trim() || "";
    const password = row.querySelector("[data-field='password']")?.value.trim() || "";
    const note = row.querySelector("[data-field='note']")?.value.trim() || "";
    return { name, email, role, activity, password, note };
  });
  saveAccounts(items.filter((item) => item.name || item.password));
  renderAccounts();
  addAudit("Uloženy účty");
});

const handleAccountDelete = (event) => {
  const button = event.target.closest("[data-action='delete']");
  if (!button) return;
  const row = button.closest("[data-account-index]");
  if (!row) return;
  row.remove();
  saveAccountsButton?.click();
};

accountList?.addEventListener("click", handleAccountDelete);
accountListDetailed?.addEventListener("click", handleAccountDelete);

const renderRecentTransactions = () => {
  if (!recentTransactions) return;
  const stored = localStorage.getItem(TX_KEY);
  if (!stored) {
    recentTransactions.innerHTML = "<p class=\"muted\">Žádné transakce.</p>";
    return;
  }
  try {
    const rows = JSON.parse(stored);
    if (!Array.isArray(rows) || rows.length === 0) {
      recentTransactions.innerHTML = "<p class=\"muted\">Žádné transakce.</p>";
      return;
    }
    recentTransactions.innerHTML = rows
      .slice(0, 5)
      .map(
        (row) => `
          <div class="audit-item">
            <span>${row.desc} · ${row.amount} · ${row.section}</span>
            <small>${row.enteredBy || "Admin"}</small>
          </div>
        `
      )
      .join("");
  } catch {
    recentTransactions.innerHTML = "<p class=\"muted\">Žádné transakce.</p>";
  }
};

const renderRecentEdits = () => {
  if (!recentEdits) return;
  const stored = localStorage.getItem(EDITS_KEY);
  if (!stored) {
    recentEdits.innerHTML = "<p class=\"muted\">Žádné změny.</p>";
    return;
  }
  try {
    const edits = JSON.parse(stored);
    const entries = Object.entries(edits || {}).slice(0, 5);
    if (!entries.length) {
      recentEdits.innerHTML = "<p class=\"muted\">Žádné změny.</p>";
      return;
    }
    recentEdits.innerHTML = entries
      .map(([key, value]) => `<div class="audit-item"><span>${key}</span><small>${value}</small></div>`)
      .join("");
  } catch {
    recentEdits.innerHTML = "<p class=\"muted\">Žádné změny.</p>";
  }
};

const RESET_ACCOUNTING_FLAG = "soa_reset_accounting_once_v1";
const resetAccountingData = () => {
  localStorage.removeItem(EDITS_KEY);
  localStorage.removeItem(TX_KEY);
  localStorage.removeItem(AUDIT_KEY);
  localStorage.removeItem(INVENTORY_KEY);
  localStorage.removeItem(DEBTS_KEY);
  localStorage.setItem(EDITS_KEY, JSON.stringify({}));
  localStorage.setItem(TX_KEY, JSON.stringify([]));
  localStorage.setItem(AUDIT_KEY, JSON.stringify([]));
  localStorage.setItem(INVENTORY_KEY, JSON.stringify([]));
  localStorage.setItem(DEBTS_KEY, JSON.stringify([]));
  if (firebaseEnabled) {
    firebaseStore.setDocValue(EDITS_KEY, {}).catch(() => {});
    firebaseStore.setDocValue(TX_KEY, []).catch(() => {});
    firebaseStore.setDocValue(AUDIT_KEY, []).catch(() => {});
    firebaseStore.setDocValue(INVENTORY_KEY, []).catch(() => {});
    firebaseStore.setDocValue(DEBTS_KEY, []).catch(() => {});
  }
  renderAudit();
  renderRecentTransactions();
  renderRecentEdits();
  renderInventory();
  renderDebts(!isAdminRole());
  recalcTotals();
};

if (!localStorage.getItem(RESET_ACCOUNTING_FLAG)) {
  resetAccountingData();
  localStorage.setItem(RESET_ACCOUNTING_FLAG, "done");
}

clearAudit?.addEventListener("click", () => {
  localStorage.removeItem(AUDIT_KEY);
  if (firebaseEnabled) firebaseStore.setDocValue(AUDIT_KEY, []).catch(() => {});
  renderAudit();
});

renderAudit();
renderRecentTransactions();
renderRecentEdits();
renderAnnouncementsAdmin();
renderAnnouncementsPublic();
renderGalleryAdmin();
renderGalleryPublic();
renderBanner();
renderAccounts();
renderDebts(!isAdminRole());
loadBannerForm();
updateModalItemControl();
renderRentalRequests();
if (rentalWebhook) rentalWebhook.value = getRentalWebhook();

hydrateFromFirebase().then(() => {
  loadEdits();
  loadTransactions();
  renderAudit();
  renderRecentTransactions();
  renderRecentEdits();
  renderAnnouncementsAdmin();
  renderAnnouncementsPublic();
  renderGalleryAdmin();
  renderGalleryPublic();
  renderBanner();
  renderAccounts();
  renderDebts(!isAdminRole());
  loadBannerForm();
  updateModalItemControl();
  renderRentalRequests();
  if (rentalWebhook) rentalWebhook.value = getRentalWebhook();
  recalcTotals();
  renderInventory();
});

rentalList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action='resolve']");
  if (!button) return;
  const row = button.closest("[data-rental-id]");
  if (!row) return;
  const id = row.dataset.rentalId;
  const items = getRentalRequests();
  const updated = items.map((item) => (item.id === id ? { ...item, status: "done" } : item));
  saveRentalRequests(updated);
  renderRentalRequests();
  addAudit("Vyřízena žádost o pronájem");
});

const menuGrid = document.getElementById("menuGrid");
const orderList = document.getElementById("orderList");
const orderTotal = document.getElementById("orderTotal");

const formatMoney = (value) => `$ ${value.toLocaleString("cs-CZ")}`;

const updateOrderSummary = () => {
  if (!menuGrid || !orderList || !orderTotal) return;
  let total = 0;
  const items = [];
  menuGrid.querySelectorAll(".menu-card").forEach((card) => {
    const qty = Number(card.querySelector(".qty-value")?.textContent || 0);
    if (!qty) return;
    const name = card.dataset.item || "Položka";
    const price = Number(card.dataset.price || 0);
    const line = price * qty;
    total += line;
    items.push({ name, qty, line });
  });
  orderList.innerHTML = items.length
    ? items
        .map(
          (item) => `
            <div class="order-item">
              <span>${item.name} × ${item.qty}</span>
              <strong>${formatMoney(item.line)}</strong>
            </div>
          `
        )
        .join("")
    : "<p class=\"muted\">Zatím prázdná objednávka.</p>";
  orderTotal.textContent = formatMoney(total);
};

menuGrid?.addEventListener("click", (event) => {
  const button = event.target.closest(".qty-btn");
  if (!button) return;
  const card = button.closest(".menu-card");
  if (!card) return;
  const valueNode = card.querySelector(".qty-value");
  if (!valueNode) return;
  const current = Number(valueNode.textContent || 0);
  const next = button.dataset.action === "plus" ? current + 1 : Math.max(0, current - 1);
  valueNode.textContent = String(next);
  updateOrderSummary();
});

updateOrderSummary();
