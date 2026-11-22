(function () {
  'use strict';

  var PROFILE_FIELDS = [
    { key: 'name', label: 'Name' },
    { key: 'educationLevel', label: 'Education level' },
    { key: 'course', label: 'Course' },
    { key: 'collegeType', label: 'College type' },
    { key: 'academicYear', label: 'Academic year' },
    { key: 'category', label: 'Category' },
    { key: 'district', label: 'District' },
    { key: 'institution', label: 'Institution' }
  ];

  var SUBMITTED_NOTE = 'Submitted is self-reported by you and is not verified by the scholarship provider.';
  var NO_PROFILE_TEXT = 'No student profile found.';
  var PREVIEW_LIMIT = 3;

  var TRACKER_STATUSES = ['not-started', 'in-progress', 'submitted'];

  function text(v) {
    return typeof v === 'string' ? v.trim() : '';
  }

  function isPlainObject(v) {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
  }

  function field(obj, key) {
    return isPlainObject(obj) ? obj[key] : undefined;
  }

  function buildProfileSummary(profile) {
    if (!isPlainObject(profile)) {
      return { hasProfile: false, rows: [] };
    }
    var rows = [];
    for (var i = 0; i < PROFILE_FIELDS.length; i++) {
      var value = text(profile[PROFILE_FIELDS[i].key]);
      if (value) {
        rows.push({ label: PROFILE_FIELDS[i].label, value: value });
      }
    }
    return { hasProfile: true, rows: rows };
  }

  function buildTrackerCounts(entries) {
    var counts = { tracked: 0, notStarted: 0, inProgress: 0, submitted: 0 };
    if (!Array.isArray(entries)) {
      return counts;
    }
    var seen = {};
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      if (!isPlainObject(e) || TRACKER_STATUSES.indexOf(e.status) === -1) {
        continue;
      }
      var id = text(e.schemeId);
      if (!id) {
        continue;
      }
      var key = '$' + id;
      if (seen[key]) {
        continue;
      }
      seen[key] = true;
      counts.tracked += 1;
      if (e.status === 'not-started') {
        counts.notStarted += 1;
      } else if (e.status === 'in-progress') {
        counts.inProgress += 1;
      } else if (e.status === 'submitted') {
        counts.submitted += 1;
      }
    }
    return counts;
  }

  function buildOverview(savedCount, trackerEntries) {
    var counts = buildTrackerCounts(trackerEntries);
    var saved = typeof savedCount === 'number' && isFinite(savedCount) && savedCount >= 0 ? savedCount : 0;
    return {
      saved: saved,
      tracked: counts.tracked,
      inProgress: counts.inProgress,
      submitted: counts.submitted,
      submittedNote: SUBMITTED_NOTE
    };
  }

  function buildSavedPreview(resolvedSaved, limit) {
    if (!Array.isArray(resolvedSaved)) {
      return { total: 0, items: [] };
    }
    var n = limit || PREVIEW_LIMIT;
    var items = [];
    var max = Math.min(n, resolvedSaved.length);
    for (var i = 0; i < max; i++) {
      var e = resolvedSaved[i];
      items.push({
        schemeId: text(field(e, 'id')),
        name: text(field(e, 'name')) || text(field(e, 'id'))
      });
    }
    return { total: resolvedSaved.length, items: items };
  }

  function buildTrackerPreview(resolvedTracker, statusLabels) {
    if (!Array.isArray(resolvedTracker)) {
      return [];
    }
    var out = [];
    for (var i = 0; i < resolvedTracker.length; i++) {
      var item = resolvedTracker[i];
      var schemeId = text(field(item, 'schemeId'));
      var status = field(item, 'status');
      out.push({
        schemeId: schemeId,
        name: text(field(item, 'name')) || schemeId,
        statusLabel: text(field(item, 'statusLabel')) ||
          text(statusLabels && typeof statusLabels === 'object' ? statusLabels[status] : undefined)
      });
    }
    return out;
  }

  function buildMatchSummary(profile, results) {
    if (!isPlainObject(profile)) {
      return { state: 'no-profile' };
    }
    if (!Array.isArray(results)) {
      return { state: 'unavailable' };
    }
    var likely = 0;
    var moreInfo = 0;
    var notEligible = 0;
    var top = [];
    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      var status = field(r, 'status');
      if (status === 'Likely Eligible') {
        likely += 1;
      } else if (status === 'More Information Required') {
        moreInfo += 1;
      } else if (status === 'Not Eligible Based on Available Information') {
        notEligible += 1;
      }
      if (i < 3) {
        var schemeId = text(field(r, 'schemeId'));
        top.push({
          schemeId: schemeId,
          name: text(field(r, 'schemeName')) || schemeId,
          status: text(status)
        });
      }
    }
    return {
      state: 'ok',
      total: results.length,
      likely: likely,
      moreInfo: moreInfo,
      notEligible: notEligible,
      top: top
    };
  }

  function buildActionsList() {
    return [
      { label: 'Find scholarships', href: 'results.html' },
      { label: 'View saved scholarships', href: 'saved.html' },
      { label: 'Track applications', href: 'tracker.html' },
      { label: 'Compare scholarships', href: 'comparison.html' },
      { label: 'Edit profile', href: 'profile.html' }
    ];
  }

  var api = {
    PROFILE_FIELDS: PROFILE_FIELDS,
    SUBMITTED_NOTE: SUBMITTED_NOTE,
    NO_PROFILE_TEXT: NO_PROFILE_TEXT,
    PREVIEW_LIMIT: PREVIEW_LIMIT,
    buildProfileSummary: buildProfileSummary,
    buildTrackerCounts: buildTrackerCounts,
    buildOverview: buildOverview,
    buildSavedPreview: buildSavedPreview,
    buildTrackerPreview: buildTrackerPreview,
    buildMatchSummary: buildMatchSummary,
    buildActionsList: buildActionsList
  };

  if (typeof window !== 'undefined') { window.THUNAI_DASHBOARD_MODEL = api; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
})();
