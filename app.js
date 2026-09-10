const campaigns = [
  { id: 1, name: 'Coke Campaign 1', budget: 400000, redeemedPct: 42 },
  { id: 2, name: 'Coke Campaign 2', budget: 200000, redeemedPct: 54 },
  { id: 3, name: 'Coke Campaign 3', budget: 350000, redeemedPct: 92 },
];

const fee = 0.75;
const visibleCredits = 485400;
const splits = {
  grocer: 0.10,
  agency: 0.20,
  pos: 0.02,
  stripePartner: 0.005,
};
splits.gft = +(fee - Object.values(splits).reduce((a,b) => a+b, 0)).toFixed(3);

const defaultState = {
  bankConnected: false,
  bankName: '',
  bankEnding: '',
  activeScreen: 'home',
  selectedCampaign: 1,
  demoRedemptions: 0,
  privyMirrorsCreated: false,
  payouts: {
    grocer: 'Fiat', agency: 'Fiat', pos: 'Fiat', stripePartner: 'USDC', gft: 'USDC', shopper: 'Fiat'
  },
  customCampaigns: [],
  shopperPhone: '',
  shopperDevice: '',
  shopperRewardLoaded: false
};

let state = loadState();
let deferredInstallPrompt = null;

const viewport = document.getElementById('appViewport');
const plaidModal = document.getElementById('plaidModal');
const plaidError = document.getElementById('plaidError');
const toast = document.getElementById('toast');

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('gftPrototypeState') || '{}');
    return { ...structuredClone(defaultState), ...saved, payouts: { ...defaultState.payouts, ...(saved.payouts || {}) } };
  } catch {
    return structuredClone(defaultState);
  }
}
function saveState() { localStorage.setItem('gftPrototypeState', JSON.stringify(state)); }
function money(n, decimals = 0) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n); }
function numberFmt(n) { return new Intl.NumberFormat('en-US').format(n); }
function pctMoney(c) { return c.budget * c.redeemedPct / 100; }
function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(showToast.t);
  showToast.t = setTimeout(() => toast.classList.add('hidden'), 2400);
}
function setScreen(screen) {
  state.activeScreen = screen;
  saveState();
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.screen === screen));
  render();
}

function homeScreen() {
  const bankStatus = state.bankConnected
    ? `<span class="badge green">✓ Demo bank linked · ${escapeHtml(state.bankName)} •••• ${escapeHtml(state.bankEnding)}</span>`
    : `<span class="badge orange">Banking setup incomplete</span>`;
  return `
    <section class="screen">
      <div class="screen-eyebrow">Brand onboarding</div>
      <h3>Welcome to GFT,<br>Let’s Get Started.</h3>
      <p>Start with a campaign or connect the brand’s funding source. The demo keeps every back-end step visible.</p>
      <div class="prompt-shell">
        <button class="prompt-option" data-action="buildCampaign">
          <span class="prompt-icon">＋</span><span><strong>Build A Campaign</strong><small>Create funding, budget and redemption targets</small></span>
        </button>
        <button class="prompt-option" data-action="openBanking">
          <span class="prompt-icon">▦</span><span><strong>Enter Your Banking Information</strong><small>Launch the Plaid-style demo connection</small></span>
        </button>
        <div class="prompt-bar"><input id="quickPrompt" placeholder="Ask GFT to build or fund a campaign…"><button class="prompt-send" data-action="sendPrompt">↑</button></div>
      </div>
      <div class="card credits-inline-card">
        <div class="card-title"><div><strong>Visible credits</strong><small>Persistent on every page</small></div><span class="badge blue">USDC-backed</span></div>
        <div class="credits-inline-row"><img src="./assets/usdc-logo.png" alt="USDC logo"><div><strong>${numberFmt(visibleCredits)} Credits</strong><small>Always visible at the top of the app</small></div></div>
      </div>
      <div class="card">
        <div class="card-title"><div><strong>Coke funding snapshot</strong><small>$1M master funding example</small></div>${bankStatus}</div>
        <div class="stat-row"><div class="stat"><small>Funded</small><strong>$1.0M</strong></div><div class="stat"><small>Allocated</small><strong>$950K</strong></div><div class="stat"><small>Unallocated</small><strong>$50K</strong></div></div>
        <button class="secondary-btn full" style="margin-top:10px" data-action="viewCampaigns">View 3 campaigns</button>
      </div>
    </section>`;
}

function bankingScreen() {
  if (!state.bankConnected) {
    return `
      <section class="screen">
        <div class="screen-eyebrow">Prompt 2</div>
        <h3>Enter Your Banking Information</h3>
        <p>Connect the brand funding source. This opens a Plaid-style demo modal and stores only fictional values in your browser.</p>
        <div class="card form-card">
          <div class="card-title"><div><strong>Brand funding source</strong><small>Required before moving fiat into the funding architecture</small></div><span class="badge orange">Not linked</span></div>
          <button class="primary-btn full" style="margin-top:12px" data-action="launchPlaid">Connect with Plaid demo</button>
        </div>
        <div class="flow-stack">
          <div class="flow-node"><strong>1 · Brand bank account</strong><small>Funding source supplied by Coke</small></div>
          <div class="flow-down">↓</div>
          <div class="flow-node blue"><strong>2 · GFT master account</strong><small>Bank of America funding destination in the architecture</small></div>
          <div class="flow-down">↓</div>
          <div class="flow-split"><div class="flow-node"><strong>Instruction</strong><small>GFT records source + target wallet</small></div><div class="flow-node"><strong>Funds</strong><small>Bridge converts fiat → USDC</small></div></div>
        </div>
      </section>`;
  }
  return `
    <section class="screen">
      <div class="screen-eyebrow">Banking connected</div>
      <h3>Congrats,<br>Let’s Build a Campaign.</h3>
      <div class="success-panel"><h4>Demo funding account linked</h4><p>${escapeHtml(state.bankName)} · •••• ${escapeHtml(state.bankEnding)}</p></div>
      <div class="card">
        <div class="card-title"><div><strong>Funding architecture ready</strong><small>No real funds move in this prototype</small></div><span class="badge green">Ready</span></div>
        <div class="sequence">
          <div class="sequence-step done"><span class="sequence-dot">1</span><div><strong>Funding source recorded</strong><small>Brand account is associated with Coke.</small></div></div>
          <div class="sequence-step done"><span class="sequence-dot">2</span><div><strong>GFT master-account path defined</strong><small>Bank of America master funding account.</small></div></div>
          <div class="sequence-step done"><span class="sequence-dot">3</span><div><strong>Bridge conversion rule defined</strong><small>Fiat → USDC → GFT Coke custodial wallet.</small></div></div>
        </div>
      </div>
      <div class="inline-actions"><button class="primary-btn" data-action="buildCampaign">Build campaign</button><button class="secondary-btn" data-action="relinkBank">Relink demo bank</button></div>
    </section>`;
}

function campaignBuilderScreen() {
  return `
    <section class="screen">
      <div class="screen-eyebrow">Campaign builder</div>
      <h3>Build a Campaign</h3>
      <p>Enter a campaign budget and target redemption percentage. The three Coke example campaigns remain loaded in the portfolio.</p>
      <div class="card form-card">
        <label>Campaign name<input id="newCampaignName" type="text" placeholder="Coke Campaign 4"></label>
        <label>Campaign budget<input id="newCampaignBudget" type="number" min="0" step="1000" placeholder="50000"></label>
        <label>Target / demo redeemed %<input id="newCampaignPct" type="number" min="0" max="100" step="1" placeholder="25"></label>
        <button class="primary-btn full" style="margin-top:12px" data-action="createCampaign">Create campaign in prototype</button>
      </div>
      <div class="card"><div class="card-title"><div><strong>Available from original $1M</strong><small>Original demo allocation only</small></div><strong>$50,000</strong></div><p>This builder lets you add prototype campaigns for UX testing. Custom campaigns do not alter the original $1M example unless you choose values that fit within the $50K unallocated balance.</p></div>
    </section>`;
}

function campaignsScreen() {
  const custom = state.customCampaigns.map(c => ({ ...c, isCustom: true }));
  const all = [...campaigns, ...custom];
  return `
    <section class="screen">
      <div class="screen-eyebrow">Campaign portfolio</div>
      <h3>Coke · $1M Funded</h3>
      <div class="stat-row"><div class="stat"><small>Original allocated</small><strong>$950K</strong></div><div class="stat"><small>Original unallocated</small><strong>$50K</strong></div><div class="stat"><small>Campaigns</small><strong>${all.length}</strong></div></div>
      ${all.map(c => `
        <div class="card campaign-card" data-action="campaignDetail" data-id="${c.id}">
          <div class="card-title"><div><strong>${escapeHtml(c.name)}</strong><small>${c.isCustom ? 'Prototype custom campaign' : 'Coke portfolio example'}</small></div><span class="badge ${c.redeemedPct >= 80 ? 'orange' : 'blue'}">${c.redeemedPct}% redeemed</span></div>
          <div class="progress"><div style="width:${Math.max(0, Math.min(100, c.redeemedPct))}%"></div></div>
          <div class="stat-row"><div class="stat"><small>Funding</small><strong>${money(c.budget)}</strong></div><div class="stat"><small>Redeemed value</small><strong>${money(pctMoney(c))}</strong></div><div class="stat"><small>Remaining</small><strong>${money(c.budget-pctMoney(c))}</strong></div></div>
        </div>`).join('')}
      <button class="secondary-btn full" style="margin-top:10px" data-action="buildCampaign">＋ Add campaign</button>
    </section>`;
}

function campaignDetailScreen(campaignId = state.selectedCampaign) {
  const all = [...campaigns, ...state.customCampaigns];
  const c = all.find(x => x.id === campaignId) || campaigns[0];
  state.selectedCampaign = c.id; saveState();
  return `
    <section class="screen">
      <button class="text-btn" data-action="viewCampaigns">← All campaigns</button>
      <div class="screen-eyebrow" style="margin-top:8px">Campaign detail</div>
      <h3>${escapeHtml(c.name)}</h3>
      <div class="card">
        <div class="card-title"><div><strong>${money(c.budget)} funded</strong><small>Campaign wallet allocation</small></div><span class="badge ${c.redeemedPct >= 80 ? 'orange' : 'blue'}">${c.redeemedPct}% redeemed</span></div>
        <div class="progress"><div style="width:${c.redeemedPct}%"></div></div>
        <div class="stat-row"><div class="stat"><small>Redeemed value</small><strong>${money(pctMoney(c))}</strong></div><div class="stat"><small>Remaining</small><strong>${money(c.budget-pctMoney(c))}</strong></div><div class="stat"><small>GFT fee</small><strong>$0.75 / redemption</strong></div></div>
      </div>
      <div class="card">
        <div class="card-title"><div><strong>Run one prototype redemption</strong><small>Shows the sequencing: GFT ledger first, Privy mirror second</small></div><span class="badge green">Live UI</span></div>
        <div class="demo-counter"><span>Prototype redemption events run</span><strong>${state.demoRedemptions}</strong></div>
        <button class="primary-btn full" style="margin-top:10px" data-action="simulateRedemption">Simulate 1 redemption</button>
      </div>
      ${redemptionSequenceHtml()}
    </section>`;
}

function redemptionSequenceHtml() {
  const ran = state.demoRedemptions > 0;
  const mirrored = state.privyMirrorsCreated && ran;
  return `
    <div class="card">
      <div class="card-title"><div><strong>Redemption sequence</strong><small>$0.75 fee economics per event</small></div></div>
      <div class="sequence">
        <div class="sequence-step ${ran ? 'done' : ''}"><span class="sequence-dot">1</span><div><strong>GFT programs waterfall</strong><small>$0.10 grocer · $0.20 agency · $0.02 POS · $0.01 Stripe partner* · $0.42 GFT*.</small></div></div>
        <div class="sequence-step ${mirrored ? 'done' : ''}"><span class="sequence-dot">2</span><div><strong>Privy mirror wallets created</strong><small>Stakeholder balances mirror the GFT ledger only after the GFT distribution rules exist.</small></div></div>
        <div class="sequence-step ${mirrored ? 'done' : ''}"><span class="sequence-dot">3</span><div><strong>Stripe payout rules available</strong><small>Each stakeholder can be set to fiat or USDC; shopper flow can route value to a debit-card load.</small></div></div>
      </div>
      ${ran ? `<button class="secondary-btn full" data-action="viewPayouts">View stakeholder wallets</button>` : ''}
    </div>`;
}

function flowScreen() {
  return `
    <section class="screen">
      <div class="screen-eyebrow">Back-end architecture</div>
      <h3>Funding & Redemption Flow</h3>
      <p>The prototype exposes the operating sequence instead of hiding it behind one balance.</p>
      <div class="flow-stack">
        <div class="flow-node"><strong>1 · Coke Brand</strong><small>$1,000,000 fiat funding example</small></div>
        <div class="flow-down">↓</div>
        <div class="flow-node blue"><strong>2 · GFT Rewards Master Account</strong><small>Bank of America · fiat received</small></div>
        <div class="flow-down">↓</div>
        <div class="flow-node"><strong>3 · GFT Rewards System</strong><small>Creates/identifies Coke custodial wallet + records source of funds</small></div>
        <div class="flow-down">↓</div>
        <div class="flow-split"><div class="flow-node blue"><strong>Instruction</strong><small>GFT → Bridge conversion instruction / source mapping</small></div><div class="flow-node green"><strong>Funds</strong><small>Bridge converts fiat → USDC</small></div></div>
        <div class="flow-down">↓</div>
        <div class="flow-node blue"><strong>4 · GFT Coke Custodial Wallet</strong><small>USDC campaign funding after conversion</small></div>
        <div class="flow-down">↓</div>
        <div class="flow-node"><strong>5 · GFT Campaign Wallets</strong><small>$400K · $200K · $350K allocations</small></div>
        <div class="flow-down">↓</div>
        <div class="flow-node green"><strong>6 · GFT Redemption Waterfall</strong><small>$0.75 fee programmed into stakeholder ledger entries</small></div>
        <div class="flow-down">↓</div>
        <div class="flow-node"><strong>7 · Privy Mirror + Stripe Rules</strong><small>Created after GFT ledger state; payouts in fiat or USDC</small></div>
      </div>
    </section>`;
}

function payoutsScreen() {
  const n = state.demoRedemptions;
  const balances = {
    grocer: +(splits.grocer*n).toFixed(2),
    agency: +(splits.agency*n).toFixed(2),
    pos: +(splits.pos*n).toFixed(2),
    stripePartner: +(splits.stripePartner*n).toFixed(2),
    gft: +((fee*n) - (+(splits.grocer*n).toFixed(2)) - (+(splits.agency*n).toFixed(2)) - (+(splits.pos*n).toFixed(2)) - (+(splits.stripePartner*n).toFixed(2))).toFixed(2),
  };
  return `
    <section class="screen">
      <div class="screen-eyebrow">Stakeholder distribution</div>
      <h3>GFT Ledger → Privy Mirror</h3>
      <p>The ledger is the programmed source state. Privy mirrors are shown only after a prototype redemption has been run.</p>
      <div class="ledger">
        ${ledgerRow('Grocer', splits.grocer, balances.grocer)}
        ${ledgerRow('Publisher / Agency', splits.agency, balances.agency)}
        ${ledgerRow('POS Partner', splits.pos, balances.pos)}
        ${ledgerRow('Stripe Partner', splits.stripePartner, balances.stripePartner)}
        ${ledgerRow('GFT retained', splits.gft, balances.gft)}
        <div class="ledger-row total"><div><strong>Total fee</strong><small>Per prototype redemption</small></div><strong>$0.75</strong></div>
      </div>
      ${state.demoRedemptions === 0 ? `<div class="card"><p>No prototype redemption has been run yet.</p><button class="primary-btn full" data-action="simulateRedemption">Simulate 1 redemption</button></div>` : walletMirrorsHtml(balances)}
    </section>`;
}
function ledgerRow(name, per, bal) {
  const shownPer = name === 'Stripe Partner' ? '$0.01*' : name === 'GFT retained' ? '$0.42*' : money(per, 2);
  return `<div class="ledger-row"><div><strong>${name}</strong><small>${shownPer} per redemption · ${state.demoRedemptions} event(s)</small></div><strong>${money(bal, 2)}</strong></div>`;
}
function walletMirrorsHtml(b) {
  return `
    <div class="card" style="margin-top:10px"><div class="card-title"><div><strong>Privy stakeholder mirrors</strong><small>${state.privyMirrorsCreated ? 'Created after GFT waterfall programming' : 'Pending GFT waterfall programming'}</small></div><span class="badge ${state.privyMirrorsCreated ? 'green' : 'orange'}">${state.privyMirrorsCreated ? 'Mirrored' : 'Pending'}</span></div></div>
    ${walletCard('grocer','Grocer',b.grocer)}
    ${walletCard('agency','Publisher / Agency',b.agency)}
    ${walletCard('pos','POS Partner',b.pos)}
    ${walletCard('stripePartner','Stripe Partner',b.stripePartner)}
    ${walletCard('gft','GFT',b.gft)}
    <div class="wallet-card shopper-payout-card">
      <div class="wallet-head"><div><strong>Shopper payout · Coke Redemption</strong><small>Consumer reward example</small></div><span class="badge blue">$3.00 Reward</span></div>
      <div class="shopper-reward-amount">$3.00</div>
      <p>A shopper has redeemed a Coke offer and has $3.00 available to load to a Chili Rewards Debit Card.</p>
      <button class="primary-btn full" data-action="startShopperPayout">Load to Card</button>
    </div>`;
}
function walletCard(key, name, bal) {
  return `<div class="wallet-card"><div class="wallet-head"><div><strong>${name}</strong><small>Privy mirror of GFT ledger</small></div><span class="badge ${state.privyMirrorsCreated ? 'green':'orange'}">${state.privyMirrorsCreated ? 'Ready':'Pending'}</span></div><div class="wallet-balance">${money(bal, 2)}</div><div class="segmented"><button data-action="setPayout" data-key="${key}" data-mode="Fiat" class="${state.payouts[key]==='Fiat'?'active':''}">Fiat</button><button data-action="setPayout" data-key="${key}" data-mode="USDC" class="${state.payouts[key]==='USDC'?'active':''}">USDC</button></div></div>`;
}

function shopperTextScreen() {
  return `
    <section class="screen shopper-flow-screen">
      <button class="text-btn" data-action="viewPayouts">← Stakeholder payouts</button>
      <div class="screen-eyebrow" style="margin-top:8px">Shopper payout simulation</div>
      <h3>Coke Reward Received</h3>
      <p>The shopper receives a text after the $3.00 Coke redemption.</p>
      <div class="message-shell">
        <div class="message-appbar"><span>‹</span><strong>Messages</strong><span>•••</span></div>
        <div class="message-contact"><div class="message-avatar">C</div><strong>Coke Rewards</strong><small>Text Message</small></div>
        <div class="message-bubble">COKE REWARD: You have $3.00 in rewards ready to load to your Chili Rewards Debit Card.</div>
        <button class="reward-link" data-action="openShopperReward"><span>GFT Rewards</span><strong>Load your $3.00 reward</strong><small>Secure reward link</small></button>
      </div>
    </section>`;
}

function shopperPhoneScreen() {
  return `
    <section class="screen shopper-flow-screen">
      <button class="text-btn" data-action="shopperBackToText">← Back to text</button>
      <div class="screen-eyebrow" style="margin-top:8px">Load to card</div>
      <h3>Load $3.00<br>to Chili Rewards Debit Card</h3>
      <p>Enter the mobile number tied to the GFT Rewards account.</p>
      <div class="card form-card shopper-entry-card">
        <div class="coke-lockup"><span class="coke-dot">C</span><div><strong>Chili Rewards Debit Card</strong><small>$3.00 reward available</small></div></div>
        <label>Mobile phone number
          <input id="shopperPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(310) 555-0123" value="${escapeHtml(state.shopperPhone)}">
        </label>
        <button class="primary-btn full" style="margin-top:12px" data-action="continueShopperPhone">Continue</button>
      </div>
      <p class="shopper-security">Prototype only. No phone number is transmitted or stored outside this browser.</p>
    </section>`;
}

function shopperDeviceScreen() {
  return `
    <section class="screen shopper-flow-screen">
      <button class="text-btn" data-action="shopperBackToPhone">← Phone number</button>
      <div class="screen-eyebrow" style="margin-top:8px">Choose wallet</div>
      <h3>Where should we<br>load Chili Rewards Debit Card?</h3>
      <p>$3.00 in rewards is ready. Choose the shopper’s mobile wallet.</p>
      <div class="device-grid">
        <button class="device-card" data-action="chooseShopperDevice" data-device="iPhone">
          <span class="device-icon"></span><strong>iPhone</strong><small>Add to iPhone Wallet</small>
        </button>
        <button class="device-card" data-action="chooseShopperDevice" data-device="Android">
          <span class="device-icon">A</span><strong>Android</strong><small>Add to Android Wallet</small>
        </button>
      </div>
      <div class="card"><div class="card-title"><div><strong>Reward ready</strong><small>Coke redemption</small></div><strong>$3.00</strong></div></div>
    </section>`;
}

function shopperWalletScreen() {
  const device = state.shopperDevice || 'iPhone';
  return `
    <section class="screen shopper-flow-screen wallet-success-screen">
      <div class="success-check">✓</div>
      <div class="screen-eyebrow">Added successfully</div>
      <h3>Chili Rewards Debit Card is in<br>${escapeHtml(device)} Wallet.</h3>
      <p>The shopper’s $3.00 Coke reward is now shown on the Chili Rewards Debit Card.</p>
      <div class="wallet-success-layout">
        <div class="mobile-wallet-pass">
          <div class="pass-top"><div class="chili-title">Chili Rewards</div><span>DEBIT CARD</span></div>
          <div class="pass-chip"></div>
          <div class="pass-label">REWARDS BALANCE</div>
          <div class="pass-balance">$3.00</div>
          <div class="pass-footer"><span>Chili Rewards Debit Card</span><span>•••• 3000</span></div>
        </div>
        <aside class="credits-sidecard">
          <div class="credits-side-head"><img src="./assets/usdc-logo.png" alt="USDC logo"><div><strong>Credits</strong><small>USDC-backed</small></div></div>
          <div class="credits-side-total">${numberFmt(visibleCredits)}</div>
          <div class="credits-side-note">Visible across every page in the prototype.</div>
        </aside>
      </div>
      <div class="success-panel"><h4>$3.00 loaded</h4><p>${escapeHtml(device)} Wallet · Chili Rewards Debit Card · Rewards balance $3.00</p></div>
      <button class="secondary-btn full" style="margin-top:12px" data-action="viewPayouts">Back to payouts</button>
    </section>`;
}

function render() {
  let html = '';
  if (state.activeScreen === 'home') html = homeScreen();
  else if (state.activeScreen === 'banking') html = bankingScreen();
  else if (state.activeScreen === 'builder') html = campaignBuilderScreen();
  else if (state.activeScreen === 'campaigns') html = campaignsScreen();
  else if (state.activeScreen === 'campaignDetail') html = campaignDetailScreen();
  else if (state.activeScreen === 'flow') html = flowScreen();
  else if (state.activeScreen === 'payouts') html = payoutsScreen();
  else if (state.activeScreen === 'shopperText') html = shopperTextScreen();
  else if (state.activeScreen === 'shopperPhone') html = shopperPhoneScreen();
  else if (state.activeScreen === 'shopperDevice') html = shopperDeviceScreen();
  else if (state.activeScreen === 'shopperWallet') html = shopperWalletScreen();
  viewport.innerHTML = html;
  viewport.scrollTop = 0;
}

function escapeHtml(str='') {
  return String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function openPlaid() {
  plaidModal.classList.remove('hidden');
  plaidError.classList.add('hidden');
  setTimeout(() => document.getElementById('plaidHolder').focus(), 20);
}
function closePlaid() { plaidModal.classList.add('hidden'); }

function simulateRedemption() {
  state.demoRedemptions += 1;
  state.privyMirrorsCreated = false;
  saveState();
  render();
  showToast('GFT waterfall programmed first…');
  setTimeout(() => {
    state.privyMirrorsCreated = true;
    saveState();
    if (state.activeScreen === 'campaignDetail' || state.activeScreen === 'payouts') render();
    showToast('Privy stakeholder mirrors created from the GFT ledger.');
  }, 850);
}

viewport.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  if (action === 'buildCampaign') { window.open('https://admin.gftrewards.com/', '_blank', 'noopener,noreferrer'); showToast('Opening GFT Campaign Admin…'); }
  if (action === 'openBanking') setScreen('banking');
  if (action === 'launchPlaid' || action === 'relinkBank') openPlaid();
  if (action === 'viewCampaigns') setScreen('campaigns');
  if (action === 'campaignDetail') { state.selectedCampaign = Number(el.dataset.id); state.activeScreen = 'campaignDetail'; saveState(); render(); }
  if (action === 'simulateRedemption') simulateRedemption();
  if (action === 'viewPayouts') setScreen('payouts');
  if (action === 'setPayout') {
    const { key, mode } = el.dataset;
    state.payouts[key] = mode;
    saveState(); render(); showToast(`${key === 'stripePartner' ? 'Stripe Partner' : key} payout set to ${mode}.`);
  }
  if (action === 'sendPrompt') {
    const input = document.getElementById('quickPrompt');
    const val = (input?.value || '').trim().toLowerCase();
    if (!val) { showToast('Try “build campaign” or “banking”.'); return; }
    if (val.includes('bank')) { setScreen('banking'); setTimeout(openPlaid, 80); }
    else if (val.includes('campaign')) { window.open('https://admin.gftrewards.com/', '_blank', 'noopener,noreferrer'); showToast('Opening GFT Campaign Admin…'); }
    else if (val.includes('flow') || val.includes('bridge')) setScreen('flow');
    else if (val.includes('payout') || val.includes('wallet') || val.includes('privy')) setScreen('payouts');
    else showToast('Prototype prompt understands campaign, banking, flow, wallet or payout.');
  }
  if (action === 'startShopperPayout') { state.activeScreen = 'shopperText'; saveState(); render(); }
  if (action === 'openShopperReward') { state.activeScreen = 'shopperPhone'; saveState(); render(); }
  if (action === 'shopperBackToText') { state.activeScreen = 'shopperText'; saveState(); render(); }
  if (action === 'shopperBackToPhone') { state.activeScreen = 'shopperPhone'; saveState(); render(); }
  if (action === 'continueShopperPhone') {
    const input = document.getElementById('shopperPhone');
    const phone = (input?.value || '').trim();
    if (phone.replace(/\D/g, '').length < 10) { showToast('Enter a 10-digit mobile number for the prototype.'); return; }
    state.shopperPhone = phone;
    state.activeScreen = 'shopperDevice';
    saveState(); render();
  }
  if (action === 'chooseShopperDevice') {
    state.shopperDevice = el.dataset.device || 'iPhone';
    state.shopperRewardLoaded = true;
    state.activeScreen = 'shopperWallet';
    saveState(); render();
    showToast(`$3.00 Coke reward loaded to ${state.shopperDevice} Wallet.`);
  }
  if (action === 'createCampaign') {
    const name = (document.getElementById('newCampaignName')?.value || '').trim();
    const budget = Number(document.getElementById('newCampaignBudget')?.value || 0);
    const redeemedPct = Number(document.getElementById('newCampaignPct')?.value || 0);
    if (!name || !(budget > 0) || redeemedPct < 0 || redeemedPct > 100) { showToast('Enter a name, positive budget and 0–100% redeemed value.'); return; }
    const nextId = Math.max(3, ...state.customCampaigns.map(c => c.id || 0)) + 1;
    state.customCampaigns.push({ id: nextId, name, budget, redeemedPct });
    state.activeScreen = 'campaigns'; saveState(); render(); showToast('Prototype campaign created.');
  }
});

viewport.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'quickPrompt') document.querySelector('[data-action="sendPrompt"]')?.click();
});

document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => setScreen(btn.dataset.screen)));

document.querySelectorAll('.brd-tab').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.brd-tab').forEach(b => b.classList.toggle('active', b === btn));
  document.querySelectorAll('.brd-panel').forEach(p => p.classList.toggle('active', p.id === `brd-${btn.dataset.brd}`));
}));

document.getElementById('closePlaid').addEventListener('click', closePlaid);
plaidModal.addEventListener('click', e => { if (e.target === plaidModal) closePlaid(); });

document.getElementById('connectDemoBank').addEventListener('click', () => {
  const bank = document.getElementById('plaidBank').value;
  const holder = document.getElementById('plaidHolder').value.trim();
  const routing = document.getElementById('plaidRouting').value.trim();
  const ending = document.getElementById('plaidAccount').value.trim();
  if (!holder || !/^\d{9}$/.test(routing) || !/^\d{4}$/.test(ending)) { plaidError.classList.remove('hidden'); return; }
  state.bankConnected = true;
  state.bankName = bank;
  state.bankEnding = ending;
  state.activeScreen = 'banking';
  saveState();
  closePlaid(); render(); showToast('Demo banking connection complete.');
});

document.getElementById('resetDemo').addEventListener('click', () => {
  state = structuredClone(defaultState);
  saveState();
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.screen === 'home'));
  render(); showToast('Prototype reset.');
});

document.getElementById('accountMenu').addEventListener('click', () => showToast('Coke · GFT Brand Account · 485,400 credits'));

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); deferredInstallPrompt = e;
  document.getElementById('installBtn').classList.remove('hidden');
});
document.getElementById('installBtn').addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  document.getElementById('installBtn').classList.add('hidden');
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

render();
