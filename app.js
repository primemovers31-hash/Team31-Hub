(() => {
  const rawData = window.TEAM31_HUB_DATA;

  if (!rawData) {
    return;
  }

  const STORAGE_KEY = "team31-hub-local-v1";
  const DISCORD_SERVER_ID = "1472090432358973473";
  const CATEGORY_HELP = {
    Helpful: "Useful saves, clutch follow-through, or team-helping signals.",
    Harassment: "Receipts that read like dogpiles, hostility, or targeted jabs.",
    Threat: "Language that escalates into threats or violent framing.",
    Slur: "High-priority language that should trigger adult review fast.",
    Sexualized: "Sexualized or age-sensitive language that should stay out of team spaces.",
    Attendance: "Signals about missing, skipping, or being unavailable.",
    Admin: "Server or moderation actions.",
    "Link-only": "Posts that are mostly just links, embeds, or media drops.",
    Commendation: "Local praise and positive notes added by leadership.",
    Conduct: "Local conduct reports or behavior checks.",
    "Attendance Note": "Local attendance follow-ups or schedule notes."
  };
  const QUICK_ACTIONS = [
    {
      label: "+20 Helpful Save",
      delta: 20,
      type: "commendation",
      summary: "Logged a helpful save for the team."
    },
    {
      label: "+35 Clutch Build",
      delta: 35,
      type: "commendation",
      summary: "Delivered a clutch robotics moment worth a reward bump."
    },
    {
      label: "-10 Minor Chaos",
      delta: -10,
      type: "conduct",
      summary: "Minor chaos tax logged for the record."
    },
    {
      label: "-25 Conduct Check",
      delta: -25,
      type: "conduct",
      summary: "Conduct check logged for mentor review."
    }
  ];
  const REWARD_TIERS = [
    {
      title: "Legend Status",
      scoreRange: "900+",
      tone: "good",
      copy: "Prize draft priority, aux-cord dibs, and first crack at special competition perks."
    },
    {
      title: "Trusted Operative",
      scoreRange: "760-899",
      tone: "good",
      copy: "Reliable core member status with strong trust, delegation, and room-lead backup energy."
    },
    {
      title: "Needs Tightening",
      scoreRange: "600-759",
      tone: "warn",
      copy: "Still in the game, but this is where reminders, accountability, and behavior follow-up start stacking."
    },
    {
      title: "Critical Review",
      scoreRange: "Below 600",
      tone: "risk",
      copy: "This should mean real mentor intervention, not a meme punishment wheel."
    }
  ];
  const CAPABILITY_CARDS = [
    {
      title: "Roster Dossiers",
      copy: "Each member gets an account-style dossier with room assignment, codename, Discord identity, score band, and recent activity.",
      bullets: [
        "Tap any person to open their full dossier.",
        "Imported receipts and local notes stack together."
      ]
    },
    {
      title: "Receipt Review",
      copy: "Discord exports are mined into message counts, flagged categories, attachment signals, and timestamped evidence cards.",
      bullets: [
        "Sanitized previews show first.",
        "Raw receipt text only appears on deliberate reveal."
      ]
    },
    {
      title: "Local Report Mode",
      copy: "Leadership can add browser-local commendations, conduct notes, and point swings without touching the raw exports.",
      bullets: [
        "Quick actions are built into each dossier.",
        "Manual reports stay on this device."
      ]
    },
    {
      title: "Competition Layer",
      copy: "The hub already frames a playful score-and-reward system you can use for snacks, prizes, and room competitions.",
      bullets: [
        "Use it for rewards and motivation.",
        "Keep real discipline in the mentor lane."
      ]
    }
  ];
  const FUTURE_MODULE_CARDS = [
    {
      title: "Attendance + Check-In",
      copy: "QR or NFC sign-in, late tracking, and practice attendance trends by room and subteam.",
      bullets: [
        "Auto-generate attendance notes in Report Mode.",
        "Track travel eligibility and commitment."
      ]
    },
    {
      title: "Pit + Build Board",
      copy: "Assign pit jobs, inspection tasks, and build-season priorities with a live queue for each room.",
      bullets: [
        "Surface who owns each task.",
        "Show blockers before events."
      ]
    },
    {
      title: "Competition Ops",
      copy: "Match scouting, drive-team prep, battery rotation, checklist boards, and awards submission tracking.",
      bullets: [
        "This would turn Team31Hub into a true event command center.",
        "Perfect future home for prizes and room competitions."
      ]
    },
    {
      title: "Parent + Mentor Comms",
      copy: "Announcements, permission forms, volunteer asks, and travel reminders in one mobile feed.",
      bullets: [
        "Could pair with calendar and document storage later.",
        "Cuts down on message chaos."
      ]
    }
  ];
  const INTEGRATION_CARDS = [
    {
      title: "No Extra Plugin Needed Right Now",
      copy: "This static hub works locally with the files already in the folder.",
      bullets: [
        "Open `index.html` directly right now.",
        "Current Discord server ID on file: " + DISCORD_SERVER_ID
      ]
    },
    {
      title: "For Live Discord Sync",
      copy: "You will eventually want a Discord bot or export pipeline, because there is no Discord plugin available in this Codex session.",
      bullets: [
        "Bot could ingest messages, reports, and attendance in real time.",
        "Webhooks could push receipts into a hosted database."
      ]
    },
    {
      title: "Helpful Later",
      copy: "The plugins you already have would matter more once you expand beyond this feature.",
      bullets: [
        "Google Drive for shared docs, rosters, and leadership forms.",
        "GitHub if you want deployment, versioning, or a real hosted app workflow."
      ]
    },
    {
      title: "For Phone Install",
      copy: "To make this feel like a true mobile hub, host it somewhere simple and then add a service worker later.",
      bullets: [
        "GitHub Pages, Netlify, or Vercel are easy starts.",
        "That is what unlocks reliable add-to-home-screen behavior."
      ]
    }
  ];

  const refs = {
    heroStatGrid: document.querySelector("#hero-stat-grid"),
    searchInput: document.querySelector("#search-input"),
    roomFilter: document.querySelector("#room-filter"),
    roleFilter: document.querySelector("#role-filter"),
    categoryFilter: document.querySelector("#category-filter"),
    sortFilter: document.querySelector("#sort-filter"),
    leaderboardList: document.querySelector("#leaderboard-list"),
    roomGrid: document.querySelector("#room-grid"),
    categoryGrid: document.querySelector("#category-grid"),
    agentGrid: document.querySelector("#agent-grid"),
    agentGridCopy: document.querySelector("#agent-grid-copy"),
    dossierPanel: document.querySelector("#dossier-panel"),
    evidenceList: document.querySelector("#evidence-list"),
    evidenceCopy: document.querySelector("#evidence-copy"),
    rewardGrid: document.querySelector("#reward-grid"),
    reportForm: document.querySelector("#report-form"),
    reportTarget: document.querySelector("#report-target"),
    reportReporter: document.querySelector("#report-reporter"),
    reportType: document.querySelector("#report-type"),
    reportDelta: document.querySelector("#report-delta"),
    reportSummary: document.querySelector("#report-summary"),
    reportStatus: document.querySelector("#report-status"),
    manualFeed: document.querySelector("#manual-feed"),
    capabilityList: document.querySelector("#capability-list"),
    futureModuleList: document.querySelector("#future-module-list"),
    integrationList: document.querySelector("#integration-list")
  };

  const localState = loadLocalState();
  const dataset = normalizeData(rawData);
  const importedReceiptCount = dataset.members.filter((member) => member.sourceFolder).length;
  const state = {
    search: "",
    room: "All",
    role: "All",
    category: "All",
    sort: "score",
    selectedMemberId:
      dataset.members.find((member) => member.messageCount > 0)?.id ||
      dataset.members[0]?.id ||
      "",
    revealedEvidenceIds: new Set(),
    local: localState
  };

  bindEvents();
  populateStaticControls();
  renderAll();

  function bindEvents() {
    refs.searchInput?.addEventListener("input", (event) => {
      state.search = event.target.value.trim().toLowerCase();
      renderAll();
    });

    refs.roomFilter?.addEventListener("change", (event) => {
      state.room = event.target.value;
      renderAll();
    });

    refs.roleFilter?.addEventListener("change", (event) => {
      state.role = event.target.value;
      renderAll();
    });

    refs.categoryFilter?.addEventListener("change", (event) => {
      state.category = event.target.value;
      renderAll();
    });

    refs.sortFilter?.addEventListener("change", (event) => {
      state.sort = event.target.value;
      renderAll();
    });

    refs.agentGrid?.addEventListener("click", (event) => {
      const card = event.target.closest("[data-member-id]");
      if (!card) {
        return;
      }

      state.selectedMemberId = card.dataset.memberId || "";
      renderAll();
    });

    refs.dossierPanel?.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-quick-action]");
      if (!actionButton) {
        return;
      }

      const memberId = actionButton.dataset.memberId;
      const actionIndex = Number(actionButton.dataset.quickAction);
      const action = QUICK_ACTIONS[actionIndex];

      if (!memberId || !action) {
        return;
      }

      addLocalReport({
        memberId,
        reporter: "Quick Action",
        type: action.type,
        delta: action.delta,
        summary: action.summary
      });

      refs.reportStatus.textContent =
        "Quick action logged for " + getMemberById(memberId)?.name + ".";
      renderAll();
    });

    refs.evidenceList?.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-toggle-evidence]");
      if (!toggle) {
        return;
      }

      const evidenceId = toggle.dataset.toggleEvidence;
      if (!evidenceId) {
        return;
      }

      if (state.revealedEvidenceIds.has(evidenceId)) {
        state.revealedEvidenceIds.delete(evidenceId);
      } else {
        state.revealedEvidenceIds.add(evidenceId);
      }

      renderEvidence(getViewModel());
    });

    refs.manualFeed?.addEventListener("click", (event) => {
      const removeButton = event.target.closest("[data-remove-report]");
      if (!removeButton) {
        return;
      }

      const reportId = removeButton.dataset.removeReport;
      if (!reportId) {
        return;
      }

      state.local.reports = state.local.reports.filter((report) => report.id !== reportId);
      persistLocalState();
      refs.reportStatus.textContent = "Local report removed.";
      renderAll();
    });

    refs.reportForm?.addEventListener("submit", (event) => {
      event.preventDefault();

      const memberId = refs.reportTarget.value;
      const reporter = refs.reportReporter.value.trim() || "Anonymous lead";
      const type = refs.reportType.value;
      const delta = Number(refs.reportDelta.value);
      const summary = refs.reportSummary.value.trim();

      if (!memberId || !summary) {
        refs.reportStatus.textContent = "Choose a target and write a short summary first.";
        return;
      }

      addLocalReport({
        memberId,
        reporter,
        type,
        delta,
        summary
      });

      refs.reportSummary.value = "";
      refs.reportReporter.value = "";
      refs.reportStatus.textContent = "Local report saved for " + getMemberById(memberId)?.name + ".";
      renderAll();
    });
  }

  function populateStaticControls() {
    const rooms = dataset.rooms;
    const categories = dataset.categoryOptions;

    refs.roomFilter.innerHTML = [
      '<option value="All">All rooms</option>',
      ...rooms.map((room) => `<option value="${escapeAttribute(room)}">Room ${escapeHtml(room)}</option>`)
    ].join("");

    refs.categoryFilter.innerHTML = [
      '<option value="All">All evidence</option>',
      ...categories.map(
        (category) => `<option value="${escapeAttribute(category)}">${escapeHtml(category)}</option>`
      )
    ].join("");

    refs.reportTarget.innerHTML = dataset.members
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(
        (member) =>
          `<option value="${escapeAttribute(member.id)}">${escapeHtml(
            member.name
          )} | Room ${escapeHtml(member.room)}</option>`
      )
      .join("");
  }

  function renderAll() {
    const viewModel = getViewModel();
    renderHeroStats(viewModel);
    renderLeaderboard(viewModel);
    renderRooms(viewModel);
    renderCategories(viewModel);
    renderAgents(viewModel);
    renderDossier(viewModel);
    renderEvidence(viewModel);
    renderRewards();
    renderManualFeed(viewModel);
    renderModuleCards(refs.capabilityList, CAPABILITY_CARDS);
    renderModuleCards(refs.futureModuleList, FUTURE_MODULE_CARDS);
    renderModuleCards(refs.integrationList, INTEGRATION_CARDS);
  }

  function getViewModel() {
    const members = dataset.members.map((member) => enhanceMember(member));
    const memberMap = new Map(members.map((member) => [member.id, member]));
    const filteredMembers = members
      .filter((member) => passesFilters(member))
      .sort(sortMembers);

    if (!filteredMembers.find((member) => member.id === state.selectedMemberId)) {
      state.selectedMemberId = filteredMembers[0]?.id || members[0]?.id || "";
    }

    const selectedMember = memberMap.get(state.selectedMemberId) || filteredMembers[0] || null;
    const leaderboard = members
      .filter((member) => member.role === "Student")
      .sort(sortMembersByScore)
      .slice(0, 8);
    const combinedEvidence = buildCombinedEvidence(memberMap);
    const filteredEvidence = combinedEvidence.filter((item) =>
      passesEvidenceFilters(item, selectedMember)
    );

    return {
      members,
      filteredMembers,
      selectedMember,
      leaderboard,
      combinedEvidence,
      filteredEvidence,
      memberMap
    };
  }

  function renderHeroStats(viewModel) {
    const localReportCount = state.local.reports.length;
    const flaggedMembers = viewModel.members.filter((member) => member.flaggedCount > 0).length;
    const roomCoverage = importedReceiptCount + " / " + dataset.members.length;
    const statCards = [
      {
        label: "Roster Size",
        value: dataset.members.length,
        note: "students + mentors in one hub"
      },
      {
        label: "Receipt Coverage",
        value: roomCoverage,
        note: "members with imported Discord data"
      },
      {
        label: "Flagged Members",
        value: flaggedMembers,
        note: "people with at least one flagged receipt"
      },
      {
        label: "Local Reports",
        value: localReportCount,
        note: "browser-side notes and score changes"
      }
    ];

    refs.heroStatGrid.innerHTML = statCards
      .map(
        (card) => `
          <article class="hero-stat-card">
            <span>${escapeHtml(card.label)}</span>
            <strong>${escapeHtml(String(card.value))}</strong>
            <small>${escapeHtml(card.note)}</small>
          </article>
        `
      )
      .join("");
  }

  function renderLeaderboard(viewModel) {
    refs.leaderboardList.innerHTML = viewModel.leaderboard
      .map((member, index) => {
        const deltaLabel =
          member.localDelta === 0 ? "No local delta" : withSign(member.localDelta) + " local delta";
        return `
          <button class="ranking-card" type="button" data-member-id="${escapeAttribute(member.id)}">
            <div class="rank-top">
              <strong>#${index + 1} ${escapeHtml(member.name)}</strong>
              <span class="score-chip ${scoreTone(member.effectiveScore)}">${member.effectiveScore}</span>
            </div>
            <p>${escapeHtml(member.codename)} | Room ${escapeHtml(member.room)} | ${escapeHtml(
          member.specialty
        )}</p>
            <div class="rank-bottom">
              <span class="badge">${escapeHtml(member.conductLabel)}</span>
              <span class="badge">${escapeHtml(deltaLabel)}</span>
            </div>
          </button>
        `;
      })
      .join("");
  }

  function renderRooms(viewModel) {
    const roomCards = dataset.rooms.map((room) => {
      const roomMembers = viewModel.members.filter((member) => member.room === room);
      const imported = roomMembers.filter((member) => member.messageCount > 0).length;
      const averageScore = roomMembers.length
        ? Math.round(
            roomMembers.reduce((sum, member) => sum + member.effectiveScore, 0) / roomMembers.length
          )
        : 0;
      const flagged = roomMembers.reduce((sum, member) => sum + member.flaggedCount, 0);

      return `
        <article class="room-card">
          <div class="room-top">
            <strong>Room ${escapeHtml(room)}</strong>
            <span class="score-chip ${scoreTone(averageScore)}">${averageScore}</span>
          </div>
          <p>${roomMembers.length} rostered | ${imported} with receipts | ${flagged} flagged signals</p>
          <div class="badge-row">
            <span class="badge">${escapeHtml(roomMembers.map((member) => member.lastName).join(", "))}</span>
          </div>
        </article>
      `;
    });

    refs.roomGrid.innerHTML = roomCards.join("");
  }

  function renderCategories(viewModel) {
    const combinedCounts = new Map();

    viewModel.combinedEvidence.forEach((item) => {
      item.categories.forEach((category) => {
        combinedCounts.set(category, (combinedCounts.get(category) || 0) + 1);
      });
    });

    const cards = Array.from(combinedCounts.entries())
      .sort((left, right) => right[1] - left[1])
      .map(([category, count]) => {
        const tone = categoryTone(category);
        const isActive = state.category === category;
        return `
          <button class="category-card ${isActive ? "is-active" : ""}" type="button" data-set-category="${escapeAttribute(
            category
          )}">
            <div class="rank-top">
              <strong>${escapeHtml(category)}</strong>
              <span class="category-chip ${tone}">${count}</span>
            </div>
            <p>${escapeHtml(CATEGORY_HELP[category] || "Imported moderation signal.")}</p>
          </button>
        `;
      });

    refs.categoryGrid.innerHTML = cards.join("");
    refs.categoryGrid.querySelectorAll("[data-set-category]").forEach((button) => {
      button.addEventListener("click", () => {
        state.category = button.dataset.setCategory || "All";
        refs.categoryFilter.value = state.category;
        renderAll();
      });
    });
  }

  function renderAgents(viewModel) {
    refs.agentGridCopy.textContent =
      viewModel.filteredMembers.length +
      " agents shown. Tap a card to open the dossier and quick controls.";

    if (!viewModel.filteredMembers.length) {
      refs.agentGrid.innerHTML = emptyState(
        "No agents match the current filters.",
        "Try a different room, role, or evidence category."
      );
      return;
    }

    refs.agentGrid.innerHTML = viewModel.filteredMembers
      .map((member) => {
        const selectedClass = member.id === state.selectedMemberId ? " is-selected" : "";
        const receiptLabel = member.messageCount
          ? member.messageCount + " imported messages"
          : "No receipt export loaded yet";

        return `
          <button class="agent-card${selectedClass}" type="button" data-member-id="${escapeAttribute(member.id)}">
            <div class="agent-top">
              ${renderAvatar(member)}
              <div>
                <strong>${escapeHtml(member.name)}</strong>
                <p>${escapeHtml(member.codename)} | ${escapeHtml(member.role)} | Room ${escapeHtml(
          member.room
        )}</p>
              </div>
            </div>
            <div class="badge-row">
              <span class="score-chip ${scoreTone(member.effectiveScore)}">${member.effectiveScore}</span>
              <span class="badge">${escapeHtml(member.specialty)}</span>
              <span class="badge">${escapeHtml(member.conductLabel)}</span>
            </div>
            <p>${escapeHtml(receiptLabel)}</p>
            <div class="agent-bottom">
              <span class="badge">${escapeHtml(withSign(member.localDelta))} local</span>
              <span class="badge">${member.flaggedCount} flagged</span>
            </div>
          </button>
        `;
      })
      .join("");
  }

  function renderDossier(viewModel) {
    const member = viewModel.selectedMember;

    if (!member) {
      refs.dossierPanel.innerHTML = emptyState(
        "Pick an agent to open the dossier.",
        "This panel shows score controls, activity, and recent receipts."
      );
      return;
    }

    const recentReceipts = member.messages.slice(0, 6);
    const localReports = member.localReports.slice(0, 5);
    const meterWidth = Math.max(8, Math.min(100, ((member.effectiveScore - 300) / 700) * 100));
    const roles = member.roles.length
      ? `<div class="badge-row">${member.roles
          .slice(0, 6)
          .map((role) => `<span class="badge">${escapeHtml(role)}</span>`)
          .join("")}</div>`
      : '<p class="tiny-copy">No Discord role list imported for this person yet.</p>';

    refs.dossierPanel.innerHTML = `
      <div class="dossier-wrap">
        <section class="dossier-score">
          <div class="dossier-score-top">
            <div class="avatar-row">
              ${renderAvatar(member)}
              <div>
                <strong>${escapeHtml(member.name)}</strong>
                <p>${escapeHtml(member.codename)} | ${escapeHtml(member.specialty)}</p>
              </div>
            </div>
            <span class="score-chip ${scoreTone(member.effectiveScore)}">${member.conductLabel}</span>
          </div>
          <div class="score-value">${member.effectiveScore}</div>
          <p>${escapeHtml(member.role)} in Room ${escapeHtml(member.room)} | ${member.messageCount} imported messages | ${
      member.flaggedCount
    } flagged receipts</p>
          <div class="score-meter"><span style="width:${meterWidth}%"></span></div>
          <div class="quick-action-row">
            ${QUICK_ACTIONS.map(
              (action, index) => `
                <button
                  class="quick-action-button"
                  type="button"
                  data-quick-action="${index}"
                  data-member-id="${escapeAttribute(member.id)}"
                >
                  ${escapeHtml(action.label)}
                </button>
              `
            ).join("")}
          </div>
        </section>

        <section class="dossier-block">
          <div class="rank-top">
            <strong>Intel</strong>
            <span class="badge">${escapeHtml(member.messageCount ? "Imported" : "No export yet")}</span>
          </div>
          <div class="info-list">
            <p><span class="info-label">Discord</span>${escapeHtml(
              member.discordDisplay || member.discordUsername || "Not linked yet"
            )}</p>
            <p><span class="info-label">Username</span>${escapeHtml(member.discordUsername || "Unknown")}</p>
            <p><span class="info-label">Joined</span>${escapeHtml(member.joinedServer || "Unknown")}</p>
            <p><span class="info-label">Source</span>${
              member.sourceFolder
                ? `<a href="${escapeAttribute(member.sourceFolder)}" target="_blank" rel="noreferrer">${escapeHtml(
                    member.sourceFolder
                  )}</a>`
                : "No receipt folder loaded"
            }</p>
          </div>
          ${roles}
        </section>

        <section class="dossier-block">
          <div class="rank-top">
            <strong>Snapshot</strong>
            <span class="badge">${escapeHtml(withSign(member.localDelta))} local delta</span>
          </div>
          <div class="mini-stat-grid">
            <article>
              <small>Imported messages</small>
              <strong>${member.messageCount}</strong>
            </article>
            <article>
              <small>Flagged</small>
              <strong>${member.flaggedCount}</strong>
            </article>
            <article>
              <small>Attachments</small>
              <strong>${member.attachmentCount}</strong>
            </article>
            <article>
              <small>Last seen</small>
              <strong>${escapeHtml(formatDate(member.lastSeen))}</strong>
            </article>
          </div>
        </section>

        <section class="dossier-block">
          <div class="rank-top">
            <strong>Recent Receipts</strong>
            <span class="badge">${recentReceipts.length}</span>
          </div>
          ${
            recentReceipts.length
              ? `<div class="receipt-stack">${recentReceipts
                  .map(
                    (message) => `
                      <article class="mini-receipt">
                        <p>${escapeHtml(message.preview || message.text || "No preview")}</p>
                        <div class="badge-row">
                          ${
                            message.categories.length
                              ? message.categories
                                  .map(
                                    (category) =>
                                      `<span class="category-chip ${categoryTone(category)}">${escapeHtml(
                                        category
                                      )}</span>`
                                  )
                                  .join("")
                              : '<span class="badge">No category</span>'
                          }
                          <span class="badge">${escapeHtml(formatDate(message.timestampIso, message.timestampLabel))}</span>
                        </div>
                      </article>
                    `
                  )
                  .join("")}</div>`
              : '<p class="tiny-copy">No imported receipts for this member yet.</p>'
          }
        </section>

        <section class="dossier-block">
          <div class="rank-top">
            <strong>Local Notes</strong>
            <span class="badge">${localReports.length}</span>
          </div>
          ${
            localReports.length
              ? `<div class="receipt-stack">${localReports
                  .map(
                    (report) => `
                      <article class="mini-receipt">
                        <p>${escapeHtml(report.summary)}</p>
                        <div class="badge-row">
                          <span class="score-chip ${scoreTone(member.score + report.delta)}">${withSign(
                        report.delta
                      )}</span>
                          <span class="badge">${escapeHtml(report.typeLabel)}</span>
                          <span class="badge">${escapeHtml(report.reporter)}</span>
                        </div>
                      </article>
                    `
                  )
                  .join("")}</div>`
              : '<p class="tiny-copy">No local reports stacked on this dossier yet.</p>'
          }
        </section>
      </div>
    `;
  }

  function renderEvidence(viewModel) {
    refs.evidenceCopy.textContent =
      viewModel.filteredEvidence.length + " evidence items match the current filters.";

    if (!viewModel.filteredEvidence.length) {
      refs.evidenceList.innerHTML = emptyState(
        "No evidence items match the current filters.",
        "Try clearing the category filter or selecting a different member."
      );
      return;
    }

    refs.evidenceList.innerHTML = viewModel.filteredEvidence
      .slice(0, 50)
      .map((item) => {
        const revealRaw = state.revealedEvidenceIds.has(item.id);
        const canReveal = Boolean(item.rawText && item.rawText !== item.preview);
        const metaLabel = item.kind === "local" ? "Local report" : "Imported receipt";

        return `
          <article class="evidence-card">
            <div class="evidence-top">
              <div>
                <strong>${escapeHtml(item.memberName)}</strong>
                <p>${escapeHtml(metaLabel)} | Room ${escapeHtml(item.room)} | ${escapeHtml(
          formatDate(item.timestampIso, item.timestampLabel)
        )}</p>
              </div>
              <span class="score-chip ${scoreTone(700 + item.scoreDelta)}">${withSign(item.scoreDelta)}</span>
            </div>
            <div class="badge-row">
              ${item.categories
                .map(
                  (category) =>
                    `<span class="category-chip ${categoryTone(category)}">${escapeHtml(category)}</span>`
                )
                .join("")}
            </div>
            <p>${escapeHtml(item.preview)}</p>
            ${
              item.attachmentNames.length
                ? `<div class="badge-row">${item.attachmentNames
                    .map((name) => `<span class="badge">${escapeHtml(name)}</span>`)
                    .join("")}</div>`
                : ""
            }
            ${
              canReveal
                ? `
                  <button class="toggle-raw-button" type="button" data-toggle-evidence="${escapeAttribute(item.id)}">
                    ${revealRaw ? "Hide raw receipt" : "Reveal raw receipt"}
                  </button>
                  ${revealRaw ? `<pre class="raw-receipt">${escapeHtml(item.rawText)}</pre>` : ""}
                `
                : ""
            }
            <div class="receipt-links">
              ${
                item.sourcePath
                  ? `<a href="${escapeAttribute(item.sourcePath)}" target="_blank" rel="noreferrer">Open source export</a>`
                  : ""
              }
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderRewards() {
    refs.rewardGrid.innerHTML = REWARD_TIERS.map(
      (tier) => `
        <article class="reward-card">
          <strong>${escapeHtml(tier.title)}</strong>
          <p>${escapeHtml(tier.copy)}</p>
          <span class="score-chip ${tier.tone}">${escapeHtml(tier.scoreRange)}</span>
        </article>
      `
    ).join("");
  }

  function renderManualFeed(viewModel) {
    if (!state.local.reports.length) {
      refs.manualFeed.innerHTML = emptyState(
        "No local reports saved yet.",
        "Use Report Mode or the dossier quick actions to start layering notes on top of the imports."
      );
      return;
    }

    refs.manualFeed.innerHTML = state.local.reports
      .slice()
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .map((report) => {
        const member = viewModel.memberMap.get(report.memberId);
        return `
          <article class="manual-card">
            <div class="manual-top">
              <div>
                <strong>${escapeHtml(member?.name || "Unknown member")}</strong>
                <p>${escapeHtml(report.typeLabel)} | ${escapeHtml(report.reporter)} | ${escapeHtml(
          formatDate(report.createdAt)
        )}</p>
              </div>
              <button class="toggle-raw-button" type="button" data-remove-report="${escapeAttribute(report.id)}">
                Remove
              </button>
            </div>
            <p>${escapeHtml(report.summary)}</p>
            <div class="badge-row">
              <span class="score-chip ${scoreTone((member?.score || 700) + report.delta)}">${withSign(
          report.delta
        )}</span>
              <span class="badge">Room ${escapeHtml(member?.room || "?")}</span>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderModuleCards(target, cards) {
    if (!target) {
      return;
    }

    target.innerHTML = cards
      .map(
        (card) => `
          <article class="module-card">
            <strong>${escapeHtml(card.title)}</strong>
            <p>${escapeHtml(card.copy)}</p>
            <ul>
              ${card.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
            </ul>
          </article>
        `
      )
      .join("");
  }

  function enhanceMember(member) {
    const localReports = state.local.reports
      .filter((report) => report.memberId === member.id)
      .slice()
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
    const localDelta = localReports.reduce((sum, report) => sum + report.delta, 0);
    const effectiveScore = clamp(member.score + localDelta, 300, 999);

    return {
      ...member,
      localReports,
      localDelta,
      effectiveScore,
      conductLabel: getConductLabel(effectiveScore, member.flaggedCount)
    };
  }

  function buildCombinedEvidence(memberMap) {
    const imported = dataset.evidenceFeed.map((item) => ({
      ...item,
      kind: "imported"
    }));

    const local = state.local.reports.map((report) => {
      const member = memberMap.get(report.memberId);
      const category = localReportCategory(report.type);
      return {
        id: report.id,
        memberId: report.memberId,
        memberName: member?.name || "Unknown member",
        room: member?.room || "?",
        categories: [category],
        preview: report.summary,
        rawText: report.summary,
        attachmentNames: [],
        sourcePath: "",
        timestampIso: report.createdAt,
        timestampLabel: formatDate(report.createdAt),
        scoreDelta: report.delta,
        kind: "local"
      };
    });

    return [...local, ...imported].sort((left, right) => {
      const severity = left.scoreDelta - right.scoreDelta;
      if (severity !== 0) {
        return severity;
      }
      return toTime(right.timestampIso) - toTime(left.timestampIso);
    });
  }

  function passesFilters(member) {
    if (state.room !== "All" && member.room !== state.room) {
      return false;
    }

    if (state.role !== "All" && member.role !== state.role) {
      return false;
    }

    if (state.category !== "All" && !memberHasCategory(member, state.category)) {
      return false;
    }

    if (!state.search) {
      return true;
    }

    return member.searchBlob.includes(state.search);
  }

  function passesEvidenceFilters(item) {
    if (state.category !== "All" && !item.categories.includes(state.category)) {
      return false;
    }

    if (state.room !== "All" && item.room !== state.room) {
      return false;
    }

    if (!state.search) {
      return true;
    }

    return (
      item.memberName.toLowerCase().includes(state.search) ||
      item.preview.toLowerCase().includes(state.search)
    );
  }

  function memberHasCategory(member, category) {
    if (member.topCategories.includes(category)) {
      return true;
    }

    if (member.messages.some((message) => message.categories.includes(category))) {
      return true;
    }

    return member.localReports.some((report) => localReportCategory(report.type) === category);
  }

  function sortMembers(left, right) {
    switch (state.sort) {
      case "flags":
        return right.flaggedCount - left.flaggedCount || sortMembersByScore(left, right);
      case "activity":
        return right.messageCount - left.messageCount || sortMembersByScore(left, right);
      case "recent":
        return toTime(right.lastSeen) - toTime(left.lastSeen) || sortMembersByScore(left, right);
      case "score":
      default:
        return sortMembersByScore(left, right);
    }
  }

  function sortMembersByScore(left, right) {
    return (
      right.effectiveScore - left.effectiveScore ||
      right.helpfulCount - left.helpfulCount ||
      left.name.localeCompare(right.name)
    );
  }

  function addLocalReport({ memberId, reporter, type, delta, summary }) {
    const report = {
      id: cryptoId(),
      memberId,
      reporter,
      type,
      typeLabel: reportTypeLabel(type),
      delta,
      summary,
      createdAt: new Date().toISOString()
    };

    state.local.reports = [report, ...state.local.reports];
    persistLocalState();
  }

  function persistLocalState() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.local));
  }

  function loadLocalState() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
      const reports = asList(parsed.reports).map((report) => ({
        id: String(report.id || cryptoId()),
        memberId: String(report.memberId || ""),
        reporter: String(report.reporter || "Unknown"),
        type: String(report.type || "conduct"),
        typeLabel: reportTypeLabel(report.type || "conduct"),
        delta: Number(report.delta || 0),
        summary: String(report.summary || ""),
        createdAt: String(report.createdAt || new Date().toISOString())
      }));

      return { reports };
    } catch (error) {
      return { reports: [] };
    }
  }

  function normalizeData(source) {
    const members = asList(source.members).map(normalizeMember);
    const rooms = Array.from(new Set(members.map((member) => member.room))).sort((left, right) =>
      left.localeCompare(right, undefined, { numeric: true })
    );
    const messageLookup = new Map();

    members.forEach((member) => {
      member.messages.forEach((message) => {
        messageLookup.set(member.id + ":" + message.id, message);
      });
    });

    const evidenceFeed = asList(source.evidenceFeed).map((item) => normalizeEvidence(item, messageLookup));
    const importedCategories = Array.from(
      new Set([
        ...evidenceFeed.flatMap((item) => item.categories),
        ...members.flatMap((member) => member.topCategories)
      ])
    ).sort((left, right) => left.localeCompare(right));

    const localCategories = ["Commendation", "Conduct", "Attendance Note", "Admin"];
    const categoryOptions = Array.from(new Set([...importedCategories, ...localCategories])).sort((a, b) =>
      a.localeCompare(b)
    );

    return {
      summary: source.summary || {},
      members,
      rooms,
      evidenceFeed,
      categoryOptions
    };
  }

  function normalizeMember(member) {
    const messages = asList(member.messages)
      .map((message) => normalizeMessage(message))
      .sort((left, right) => toTime(right.timestampIso) - toTime(left.timestampIso));
    const roles = asList(member.roles);
    const topCategories = asList(member.topCategories);
    const messageCount = Number(member.messageCount || messages.length || 0);
    const searchBlob = [
      member.name,
      member.firstName,
      member.lastName,
      member.codename,
      member.specialty,
      member.room,
      member.role,
      member.discordDisplay,
      member.discordUsername,
      member.serverNickname,
      roles.join(" "),
      topCategories.join(" "),
      member.note
    ]
      .join(" ")
      .toLowerCase();

    return {
      id: String(member.id || ""),
      firstName: String(member.firstName || ""),
      lastName: String(member.lastName || ""),
      name: String(member.name || ""),
      room: String(member.room || ""),
      role: String(member.role || "Student"),
      codename: String(member.codename || "Unassigned"),
      specialty: String(member.specialty || "General"),
      discordDisplay: String(member.discordDisplay || ""),
      discordUsername: String(member.discordUsername || ""),
      discordUserId: String(member.discordUserId || ""),
      joinedServer: String(member.joinedServer || ""),
      serverNickname: String(member.serverNickname || ""),
      roles,
      avatarPath: String(member.avatarPath || ""),
      sourceFolder: String(member.sourceFolder || ""),
      messageCount,
      flaggedCount: Number(member.flaggedCount || 0),
      helpfulCount: Number(member.helpfulCount || 0),
      attachmentCount: Number(member.attachmentCount || 0),
      linkOnlyCount: Number(member.linkOnlyCount || 0),
      firstSeen: String(member.firstSeen || ""),
      lastSeen: String(member.lastSeen || ""),
      score: Number(member.score || 0),
      note: String(member.note || ""),
      topCategories,
      messages,
      searchBlob
    };
  }

  function normalizeMessage(message) {
    return {
      id: String(message.id || ""),
      snowflake: String(message.snowflake || ""),
      timestampLabel: String(message.timestampLabel || ""),
      timestampIso: String(message.timestampIso || ""),
      text: String(message.text || ""),
      preview: String(message.preview || ""),
      categories: asList(message.categories),
      scoreDelta: Number(message.scoreDelta || 0),
      linkCount: Number(message.linkCount || 0),
      attachmentNames: asList(message.attachmentNames),
      sourcePath: String(message.sourcePath || "")
    };
  }

  function normalizeEvidence(item, messageLookup) {
    const memberId = String(item.memberId || "");
    const messageId = String(item.messageId || "");
    const message = messageLookup.get(memberId + ":" + messageId);

    return {
      id: "imported-" + memberId + "-" + messageId,
      memberId,
      memberName: String(item.memberName || ""),
      room: String(item.room || ""),
      categories: asList(item.categories),
      preview: String(item.preview || message?.preview || ""),
      rawText: String(message?.text || ""),
      attachmentNames: asList(item.attachmentNames || message?.attachmentNames),
      sourcePath: String(item.sourcePath || message?.sourcePath || ""),
      timestampIso: String(item.timestampIso || message?.timestampIso || ""),
      timestampLabel: String(item.timestampLabel || message?.timestampLabel || ""),
      scoreDelta: Number(item.scoreDelta || 0)
    };
  }

  function reportTypeLabel(type) {
    switch (type) {
      case "commendation":
        return "Commendation";
      case "attendance":
        return "Attendance Note";
      case "admin":
        return "Admin";
      case "conduct":
      default:
        return "Conduct";
    }
  }

  function localReportCategory(type) {
    return reportTypeLabel(type);
  }

  function getConductLabel(score, flaggedCount) {
    if (score >= 880 && flaggedCount < 10) {
      return "Trusted Operative";
    }

    if (score >= 730 && flaggedCount < 35) {
      return "Reliable Builder";
    }

    if (score >= 600 && flaggedCount < 80) {
      return "Needs Tightening";
    }

    return "Critical Review";
  }

  function scoreTone(score) {
    if (score >= 760) {
      return "good";
    }

    if (score >= 600) {
      return "warn";
    }

    return "risk";
  }

  function categoryTone(category) {
    if (category === "Helpful" || category === "Commendation" || category === "Admin") {
      return "good";
    }

    if (category === "Attendance" || category === "Attendance Note" || category === "Link-only") {
      return "warn";
    }

    return "risk";
  }

  function renderAvatar(member) {
    if (member.avatarPath) {
      return `<img class="avatar" src="${escapeAttribute(member.avatarPath)}" alt="${escapeAttribute(
        member.name
      )}">`;
    }

    return `<div class="avatar-fallback">${escapeHtml(initialsFor(member.name))}</div>`;
  }

  function getMemberById(memberId) {
    return dataset.members.find((member) => member.id === memberId) || null;
  }

  function emptyState(title, copy) {
    return `
      <div class="empty-state">
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(copy)}</p>
      </div>
    `;
  }

  function formatDate(isoValue, fallbackLabel = "") {
    if (!isoValue) {
      return fallbackLabel || "Unknown";
    }

    const date = new Date(isoValue);
    if (Number.isNaN(date.getTime())) {
      return fallbackLabel || "Unknown";
    }

    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function withSign(value) {
    const number = Number(value || 0);
    return number > 0 ? "+" + number : String(number);
  }

  function toTime(value) {
    if (!value) {
      return 0;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function initialsFor(text) {
    return String(text || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  function cryptoId() {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }

    return "report-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
  }

  function asList(value) {
    if (Array.isArray(value)) {
      return value.filter((item) => item !== null && item !== undefined && item !== "");
    }

    if (!value) {
      return [];
    }

    if (typeof value === "object") {
      return Object.values(value).filter((item) => item !== null && item !== undefined && item !== "");
    }

    return [value];
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }
})();
