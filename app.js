// --- STATE MANAGEMENT & INITIAL DATA ---
let inventory = [
  { id: 1, name: "Ground Angus Beef", category: "Proteins", quantity: 18.5, unit: "kg", minThreshold: 5.0, cost: 12.50 },
  { id: 2, name: "Whole Milk 3.2%", category: "Dairy", quantity: 4.0, unit: "liters", minThreshold: 10.0, cost: 2.10 },
  { id: 3, name: "Brioche Burger Buns", category: "Bakery", quantity: 60, unit: "pcs", minThreshold: 20, cost: 0.45 },
  { id: 4, name: "Cheddar Cheese Slices", category: "Dairy", quantity: 12, unit: "pcs", minThreshold: 25, cost: 0.20 },
  { id: 5, name: "Espresso Beans (Arabica)", category: "Beverage", quantity: 8.2, unit: "kg", minThreshold: 3.0, cost: 22.00 },
  { id: 6, name: "Fresh Tomatoes", category: "Produce", quantity: 2.0, unit: "kg", minThreshold: 4.0, cost: 3.20 },
  { id: 7, name: "Extra Virgin Olive Oil", category: "Pantry", quantity: 0, unit: "liters", minThreshold: 2.0, cost: 14.80 }
];

let auditLogs = [
  { id: 101, timestamp: "10:15 AM", item: "Ground Angus Beef", action: "Production Usage", change: "-2.5 kg" },
  { id: 102, timestamp: "09:30 AM", item: "Whole Milk 3.2%", action: "Restock / Delivery", change: "+10.0 liters" }
];

// --- DOM ELEMENTS ---
const inventoryTableBody = document.getElementById("inventoryTableBody");
const auditLogContainer = document.getElementById("auditLogContainer");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const statusFilter = document.getElementById("statusFilter");

// Modals
const itemModal = document.getElementById("itemModal");
const batchModal = document.getElementById("batchModal");
const itemForm = document.getElementById("itemForm");
const batchForm = document.getElementById("batchForm");

// Header & Modal Trigger Buttons
const openAddModalBtn = document.getElementById("openAddModalBtn");
const openBatchModalBtn = document.getElementById("openBatchModalBtn");
const closeItemModalBtn = document.getElementById("closeItemModalBtn");
const cancelItemModalBtn = document.getElementById("cancelItemModalBtn");
const closeBatchModalBtn = document.getElementById("closeBatchModalBtn");
const cancelBatchModalBtn = document.getElementById("cancelBatchModalBtn");
const clearLogBtn = document.getElementById("clearLogBtn");

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  renderInventory();
  renderLogs();
  updateKPIs();
  setupEventListeners();
});

// --- RENDER FUNCTIONS ---
function renderInventory() {
  const searchTerm = searchInput.value.toLowerCase();
  const selectedCat = categoryFilter.value;
  const selectedStatus = statusFilter.value;

  inventoryTableBody.innerHTML = "";

  const filtered = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm);
    const matchesCat = selectedCat === "ALL" || item.category === selectedCat;
    
    let matchesStatus = true;
    if (selectedStatus === "LOW") matchesStatus = item.quantity > 0 && item.quantity <= item.minThreshold;
    else if (selectedStatus === "OUT") matchesStatus = item.quantity <= 0;
    else if (selectedStatus === "OK") matchesStatus = item.quantity > item.minThreshold;

    return matchesSearch && matchesCat && matchesStatus;
  });

  if (filtered.length === 0) {
    inventoryTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="py-8 text-center text-khaki-muted">
          No inventory items found matching your filters.
        </td>
      </tr>`;
    return;
  }

  filtered.forEach(item => {
    const totalVal = (item.quantity * item.cost).toFixed(2);
    let statusBadge = "";

    if (item.quantity <= 0) {
      statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200"><i class="fa-solid fa-circle text-[8px] mr-1.5"></i> Out of Stock</span>`;
    } else if (item.quantity <= item.minThreshold) {
      statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200"><i class="fa-solid fa-triangle-exclamation text-[8px] mr-1.5"></i> Low Stock</span>`;
    } else {
      statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"><i class="fa-solid fa-check text-[8px] mr-1.5"></i> In Stock</span>`;
    }

    const tr = document.createElement("tr");
    tr.className = "hover:bg-cream-input/50 transition border-b border-khaki-border";
    tr.innerHTML = `
      <td class="py-3 px-4 font-medium text-khaki-dark">
        <div class="font-semibold text-khaki-dark">${item.name}</div>
        <div class="text-xs text-khaki-muted">${item.category}</div>
      </td>
      <td class="py-3 px-4 text-khaki-dark font-medium">
        <span class="text-base">${item.quantity}</span> <span class="text-xs text-khaki-muted">${item.unit}</span>
      </td>
      <td class="py-3 px-4 text-khaki-muted">
        ${item.minThreshold} ${item.unit}
      </td>
      <td class="py-3 px-4 text-khaki-dark">
        $${item.cost.toFixed(2)}
      </td>
      <td class="py-3 px-4 font-semibold text-khaki-dark">
        $${totalVal}
      </td>
      <td class="py-3 px-4">
        ${statusBadge}
      </td>
      <td class="py-3 px-4 text-right space-x-1">
        <button onclick="adjustStock(${item.id}, -1)" class="px-2 py-1 bg-cream-input border border-khaki-border hover:bg-dusty-pink hover:text-white rounded text-xs text-khaki-dark font-semibold" title="Decrease Stock (-1)">-1</button>
        <button onclick="adjustStock(${item.id}, 1)" class="px-2 py-1 bg-cream-input border border-khaki-border hover:bg-dusty-pink hover:text-white rounded text-xs text-khaki-dark font-semibold" title="Increase Stock (+1)">+1</button>
        <button onclick="openEditItemModal(${item.id})" class="px-2 py-1 bg-dusty-pink/30 hover:bg-dusty-pink hover:text-white text-khaki-dark rounded text-xs ml-2 font-semibold" title="Edit Item"><i class="fa-solid fa-pen"></i></button>
        <button onclick="deleteItem(${item.id})" class="px-2 py-1 bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-800 rounded text-xs font-semibold" title="Delete Item"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    inventoryTableBody.appendChild(tr);
  });
}

function renderLogs() {
  auditLogContainer.innerHTML = "";
  if (auditLogs.length === 0) {
    auditLogContainer.innerHTML = `<p class="text-xs text-khaki-muted py-2">No activity recorded yet.</p>`;
    return;
  }

  auditLogs.slice().reverse().forEach(log => {
    const isNegative = log.change.startsWith("-");
    const changeClass = isNegative ? "text-rose-700 font-bold" : "text-emerald-700 font-bold";

    const div = document.createElement("div");
    div.className = "flex items-center justify-between text-xs bg-cream-input/60 p-2.5 rounded-lg border border-khaki-border";
    div.innerHTML = `
      <div class="flex items-center space-x-3">
        <span class="text-khaki-muted font-mono">${log.timestamp}</span>
        <span class="text-khaki-dark font-medium">${log.item}</span>
        <span class="text-khaki-muted">(${log.action})</span>
      </div>
      <div class="${changeClass}">${log.change}</div>
    `;
    auditLogContainer.appendChild(div);
  });
}

function updateKPIs() {
  const totalVal = inventory.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
  const lowStockCount = inventory.filter(i => i.quantity > 0 && i.quantity <= i.minThreshold).length;
  const outOfStockCount = inventory.filter(i => i.quantity <= 0).length;

  document.getElementById("statTotalValue").textContent = `$${totalVal.toFixed(2)}`;
  document.getElementById("statTotalItems").textContent = inventory.length;
  document.getElementById("statLowStock").textContent = lowStockCount;
  document.getElementById("statOutOfStock").textContent = outOfStockCount;
}

// --- ACTION & BUTTON HANDLERS ---
function setupEventListeners() {
  searchInput.addEventListener("input", renderInventory);
  categoryFilter.addEventListener("change", renderInventory);
  statusFilter.addEventListener("change", renderInventory);

  openAddModalBtn.addEventListener("click", () => openItemModal());
  closeItemModalBtn.addEventListener("click", closeItemModal);
  cancelItemModalBtn.addEventListener("click", closeItemModal);

  openBatchModalBtn.addEventListener("click", openBatchModal);
  closeBatchModalBtn.addEventListener("click", closeBatchModal);
  cancelBatchModalBtn.addEventListener("click", closeBatchModal);

  itemForm.addEventListener("submit", handleItemFormSubmit);
  batchForm.addEventListener("submit", handleBatchFormSubmit);

  clearLogBtn.addEventListener("click", () => {
    auditLogs = [];
    renderLogs();
  });
}

function adjustStock(id, amount) {
  const item = inventory.find(i => i.id === id);
  if (!item) return;

  const newQty = Math.max(0, parseFloat((item.quantity + amount).toFixed(2)));
  const diff = parseFloat((newQty - item.quantity).toFixed(2));
  item.quantity = newQty;

  if (diff !== 0) {
    addLog(item.name, diff > 0 ? "Manual Addition" : "Manual Deduction", `${diff > 0 ? '+' : ''}${diff} ${item.unit}`);
  }

  renderInventory();
  updateKPIs();
}

function deleteItem(id) {
  if (!confirm("Are you sure you want to remove this stock item?")) return;
  const item = inventory.find(i => i.id === id);
  if (item) {
    addLog(item.name, "SKU Removed", "Deleted");
  }
  inventory = inventory.filter(i => i.id !== id);
  renderInventory();
  updateKPIs();
}

function openItemModal(itemId = null) {
  itemForm.reset();
  if (itemId) {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;
    document.getElementById("itemId").value = item.id;
    document.getElementById("itemName").value = item.name;
    document.getElementById("itemCategory").value = item.category;
    document.getElementById("itemUnit").value = item.unit;
    document.getElementById("itemQuantity").value = item.quantity;
    document.getElementById("itemMinThreshold").value = item.minThreshold;
    document.getElementById("itemCost").value = item.cost;
    document.getElementById("modalTitle").textContent = "Edit Stock Item";
  } else {
    document.getElementById("itemId").value = "";
    document.getElementById("modalTitle").textContent = "Add New Stock Item";
  }
  itemModal.classList.remove("hidden");
}

function openEditItemModal(id) {
  openItemModal(id);
}

function closeItemModal() {
  itemModal.classList.add("hidden");
}

function handleItemFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("itemId").value;
  const name = document.getElementById("itemName").value.trim();
  const category = document.getElementById("itemCategory").value;
  const unit = document.getElementById("itemUnit").value.trim();
  const quantity = parseFloat(document.getElementById("itemQuantity").value);
  const minThreshold = parseFloat(document.getElementById("itemMinThreshold").value);
  const cost = parseFloat(document.getElementById("itemCost").value);

  if (id) {
    const item = inventory.find(i => i.id == id);
    if (item) {
      item.name = name;
      item.category = category;
      item.unit = unit;
      item.quantity = quantity;
      item.minThreshold = minThreshold;
      item.cost = cost;
      addLog(name, "Item Details Updated", "Edited SKU");
    }
  } else {
    const newItem = {
      id: Date.now(),
      name,
      category,
      unit,
      quantity,
      minThreshold,
      cost
    };
    inventory.push(newItem);
    addLog(name, "New Item Registered", `+${quantity} ${unit}`);
  }

  closeItemModal();
  renderInventory();
  updateKPIs();
}

function openBatchModal() {
  const batchItemSelect = document.getElementById("batchItemSelect");
  batchItemSelect.innerHTML = "";

  inventory.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = `${item.name} (Current: ${item.quantity} ${item.unit})`;
    batchItemSelect.appendChild(opt);
  });

  batchForm.reset();
  batchModal.classList.remove("hidden");
}

function closeBatchModal() {
  batchModal.classList.add("hidden");
}

function handleBatchFormSubmit(e) {
  e.preventDefault();
  const itemId = parseInt(document.getElementById("batchItemSelect").value);
  const deductQty = parseFloat(document.getElementById("batchDeductQty").value);
  const reason = document.getElementById("batchReason").value;

  const item = inventory.find(i => i.id === itemId);
  if (!item) return;

  if (reason.includes("Restock")) {
    item.quantity = parseFloat((item.quantity + deductQty).toFixed(2));
    addLog(item.name, reason, `+${deductQty} ${item.unit}`);
  } else {
    item.quantity = Math.max(0, parseFloat((item.quantity - deductQty).toFixed(2)));
    addLog(item.name, reason, `-${deductQty} ${item.unit}`);
  }

  closeBatchModal();
  renderInventory();
  updateKPIs();
}

function addLog(itemName, action, changeStr) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  auditLogs.push({
    id: Date.now(),
    timestamp: timeStr,
    item: itemName,
    action: action,
    change: changeStr
  });
  renderLogs();
}