// ============================================================================
// Future Gate USA — portfolio field templates
//
// The DB stores each entry's field values in a JSONB `fields` map keyed by the
// `id`s below. This file is the single source of truth for WHICH fields each
// module type has, their labels, and how they render. Adjusting a module's
// fields is a code change here — never a database migration.
//
// Field types: text | textarea | date | number | select | tags | url
// `hasEvidence: true` means the entry also has a Supporting Evidence file list
// (stored in portfolio_entry_files).
// `noun` is the singular name for one entry, used in the builder ("Add a book").
// ============================================================================

const F = (id, label, type = "textarea", extra = {}) => ({ id, label, type, ...extra });

export const TEMPLATES = {
  // Computed dashboard — no entries, assembled from every other module.
  home: { noun: null, computed: true, hasEvidence: false, fields: [] },

  about_me: {
    // The Home page's "personal statement" is composed from bio + my_story;
    // the header quote is the mission. Snapshot (photo, name, grade, location)
    // comes from the profile/students record, not these fields.
    noun: "profile", singleton: true, hasEvidence: false,
    fields: [
      F("headline", "Headline", "text", { help: "e.g. Aspiring AI researcher & community leader" }),
      F("bio", "Short biography", { help: "150–250 words" }),
      F("my_story", "My story", { help: "What inspired you, key turning points, what motivates you" }),
      F("core_values", "Core values", "tags", { help: "e.g. Integrity, Curiosity, Leadership" }),
      F("mission", "Personal mission statement"),
      F("academic_interests", "Academic interests", "tags"),
      F("personal_interests", "Personal interests", "tags"),
      F("strengths", "Key strengths & skills", "tags"),
    ],
  },

  school: {
    noun: "school", hasEvidence: true,
    fields: [
      F("school_name", "School name", "text"),
      F("location", "Location", "text"),
      F("school_type", "School type", "select",
        { options: ["Public", "Private", "Boarding", "International", "Other"] }),
      F("grades_period", "Grades & period attended", "text"),
      F("overview", "Overview & why you attended"),
      F("gpa", "GPA (optional)", "text"),
      F("coursework", "Coursework & academic interests"),
      F("activities", "Leadership & extracurriculars"),
      F("achievements", "Major achievements & awards"),
      F("reflection", "Personal reflection", { help: "What you learned and how it shaped you" }),
    ],
  },

  research: {
    noun: "research project", hasEvidence: true,
    fields: [
      F("research_area", "Research area", "text"),
      F("overview", "Research overview"),
      F("question", "Research question & objectives"),
      F("motivation", "Background & motivation"),
      F("methodology", "Research methodology"),
      F("milestones", "Key activities & milestones"),
      F("findings", "Key findings & outcomes"),
      F("skills", "Skills developed", "tags"),
      F("reflection", "Personal reflection"),
    ],
  },

  publication: {
    noun: "publication", hasEvidence: true,
    fields: [
      F("pub_type", "Publication type", "select",
        { options: ["Research Paper", "Case Study", "Literature Review", "White Paper", "Independent Study", "Essay", "Other"] }),
      F("abstract", "Abstract / executive summary"),
      F("question", "Research question & objectives"),
      F("motivation", "Background & motivation"),
      F("methodology", "Methodology"),
      F("findings", "Key findings & conclusions"),
      F("skills", "Skills developed", "tags"),
      F("reflection", "Personal reflection"),
      F("status", "Status", "select", { options: ["Draft", "Completed", "Published"] }),
      F("pub_date", "Publication date", "date"),
    ],
  },

  leadership: {
    noun: "leadership program", hasEvidence: true,
    fields: [
      F("host_org", "Host organization", "text"),
      F("overview", "Program overview"),
      F("duration", "Duration & participation", "text"),
      F("role", "My role & responsibilities"),
      F("activities", "Key activities & projects"),
      F("skills", "Leadership skills developed", "tags"),
      F("outcomes", "Achievements & outcomes"),
      F("reflection", "Personal reflection"),
    ],
  },

  community: {
    noun: "volunteer activity", hasEvidence: true,
    fields: [
      F("organization", "Organization", "text"),
      F("mission", "Purpose / mission"),
      F("role", "My role & responsibilities"),
      F("hours", "Total volunteer hours", "number"),
      F("duration", "Duration & commitment", "text"),
      F("activities", "Key activities"),
      F("impact", "Impact & outcomes"),
      F("skills", "Skills developed", "tags"),
      F("reflection", "Personal reflection"),
    ],
  },

  sport: {
    noun: "sport", hasEvidence: true,
    fields: [
      F("team", "Team / club / organization", "text"),
      F("level", "Level of participation", "select",
        { options: ["Varsity", "JV", "Club", "Regional", "National", "Elite", "Recreational"] }),
      F("duration", "Duration & commitment", "text"),
      F("position", "Position / role", "text"),
      F("achievements", "Achievements & recognition"),
      F("training", "Training & development"),
      F("teamwork", "Leadership & teamwork"),
      F("reflection", "Personal growth & reflection"),
    ],
  },

  creative: {
    noun: "creative project", hasEvidence: true,
    fields: [
      F("category", "Creative category", "select",
        { options: ["Photography", "Digital Art", "Graphic Design", "Painting", "Illustration", "Creative Writing", "Film", "Music", "Architecture", "Fashion", "Other"] }),
      F("overview", "Project overview"),
      F("concept", "Creative concept & inspiration"),
      F("process", "My creative process"),
      F("tools", "Tools & techniques used", "tags"),
      F("outcome", "Final outcome"),
      F("skills", "Skills developed", "tags"),
      F("reflection", "Personal reflection"),
    ],
  },

  book: {
    noun: "book", hasEvidence: true,
    fields: [
      F("author", "Author", "text"),
      F("genre", "Genre / category", "select",
        { options: ["Fiction", "Nonfiction", "Biography", "Science", "Business", "Philosophy", "History", "Literature", "Other"] }),
      F("summary", "Book summary"),
      F("why", "Why I chose this book"),
      F("themes", "Key themes & ideas", "tags"),
      F("quotes", "Favorite quotes"),
      F("takeaways", "Key takeaways"),
      F("reflection", "Personal reflection"),
      F("connections", "Related connections"),
    ],
  },

  travel: {
    noun: "travel experience", hasEvidence: true,
    fields: [
      F("program", "Destination & program", "text"),
      F("purpose", "Purpose of the experience"),
      F("overview", "Program overview"),
      F("experiences", "Key learning experiences"),
      F("highlights", "Highlights & memorable moments"),
      F("skills", "Skills & knowledge gained", "tags"),
      F("reflection", "Personal reflection"),
      F("connections", "Connections to my journey"),
      F("outcomes", "Achievements & outcomes"),
    ],
  },

  media: {
    noun: "media item", hasEvidence: true,
    fields: [
      F("media_type", "Media type", "select",
        { options: ["Photo", "Video", "Audio", "PDF", "Presentation", "Certificate", "Poster", "Document", "Other"] }),
      F("description", "Description"),
      F("related_activity", "Related activity", "text"),
      F("date_created", "Date created", "date"),
      F("tags", "Category & tags", "tags"),
      F("people", "People / organization (optional)", "text"),
      F("location", "Location (optional)", "text"),
      // NOTE: the spec's per-item visibility levels (Public / Admissions Only /
      // FGU Only / Family Only) are a larger access-control feature captured here
      // as metadata for now; the live gate is still the portfolio's privacy.
      F("visibility", "Visibility", "select",
        { options: ["Public", "Admissions Only", "FGU Only", "Family Only"] }),
    ],
  },

  resource: {
    noun: "resource", hasEvidence: false,
    fields: [
      F("resource_type", "Type", "select",
        { options: ["Useful Link", "Template", "Research Reference", "Download"] }),
      F("url", "Link", "url"),
      F("description", "Description"),
    ],
  },

  contact: {
    noun: "contact", singleton: true, hasEvidence: false,
    fields: [
      F("email", "Email", "text"),
      F("linkedin", "LinkedIn", "url"),
      F("links", "External links"),
      F("show_form", "Show contact form", "select", { options: ["Yes", "No"] }),
    ],
  },

  // Fallback for student-created custom modules.
  generic: {
    noun: "entry", hasEvidence: true,
    fields: [
      F("overview", "Overview"),
      F("details", "Details"),
      F("reflection", "Reflection"),
    ],
  },
};

export const templateFor = (module) => TEMPLATES[module?.template] || TEMPLATES.generic;

// Empty field map for a new entry of the given template.
export const blankFields = (templateId) =>
  Object.fromEntries((TEMPLATES[templateId]?.fields || []).map((f) => [f.id, f.type === "tags" ? [] : ""]));

// Which modules feed the dynamic Home "Portfolio Highlights" counts, and the
// label shown for each. Home counts = number of visible entries per module.
export const HIGHLIGHT_MODULES = [
  { key: "academic_journey", label: "Schools" },
  { key: "research", label: "Research Projects" },
  { key: "publications", label: "Publications" },
  { key: "leadership", label: "Leadership Programs" },
  { key: "community", label: "Volunteer Activities" },
  { key: "reading", label: "Books Read" },
  { key: "athletics", label: "Athletic Activities" },
  { key: "creative", label: "Creative Projects" },
];