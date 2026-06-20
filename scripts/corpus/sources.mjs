// Corpus manifest. `q` = archive.org search (resolver finds the _djvu.txt);
// `txt` = direct plain-text URL; `html` = direct HTML page.
// license: 'PD' public-domain English | 'verify' = confirm the English edition is free.
export const SOURCES = [
  // ── World scripture ───────────────────────────────────────────────────────
  { id: 'quran',        tag: 'scripture', license: 'PD', q: '(title:Koran OR title:Quran) AND (Rodwell OR Sale OR Pickthall)' },
  { id: 'upanishads',   tag: 'scripture', license: 'PD', q: 'Upanishads AND (Müller OR Muller OR Sacred Books of the East)' },
  { id: 'rigveda',      tag: 'scripture', license: 'PD', q: 'Rig Veda AND Griffith' },
  { id: 'bhagavad-gita',tag: 'scripture', license: 'PD', q: 'Bhagavad Gita AND (Arnold OR Besant OR Telang OR Song Celestial)' },
  { id: 'tao-te-ching', tag: 'scripture', license: 'PD', q: 'Tao Te Ching AND (Legge OR Texts of Taoism)' },
  { id: 'avesta',       tag: 'scripture', license: 'PD', q: 'Zend-Avesta AND (Darmesteter OR Mills)' },
  { id: 'pahlavi-texts',tag: 'scripture', license: 'PD', q: 'Pahlavi Texts AND West AND Sacred Books of the East' },
  { id: 'egyptian-bod', tag: 'scripture', license: 'PD', q: 'Egyptian Book of the Dead AND Budge' },
  { id: 'kojiki',       tag: 'scripture', license: 'PD', q: 'Kojiki AND Chamberlain' },

  // ── Western esoteric core (your kept list) ────────────────────────────────
  { id: 'isis-unveiled',     tag: 'esoteric', license: 'PD', q: 'Isis Unveiled AND Blavatsky' },
  { id: 'secret-doctrine',   tag: 'esoteric', license: 'PD', q: 'Secret Doctrine AND Blavatsky' },
  { id: 'manly-hall-sta',    tag: 'esoteric', license: 'PD', q: 'Secret Teachings of All Ages AND Hall' },
  { id: 'agrippa',           tag: 'esoteric', license: 'PD', q: 'Three Books of Occult Philosophy AND Agrippa' },
  { id: 'golden-dawn',       tag: 'esoteric', license: 'verify', q: 'Golden Dawn AND Regardie' },
  { id: 'crowley-magick',    tag: 'esoteric', license: 'PD', q: 'Magick in Theory and Practice AND Crowley' },
  { id: 'crowley-777',       tag: 'esoteric', license: 'PD', q: '777 AND Crowley' },
  { id: 'crowley-equinox',   tag: 'esoteric', license: 'PD', q: 'The Equinox AND Crowley AND volume 1', skip: 'resolves to modern DuQuette compilation (copyright)' },
  { id: 'levi-magic',        tag: 'esoteric', license: 'PD', q: 'Transcendental Magic AND Levi AND Waite' },
  { id: 'picatrix',          tag: 'esoteric', license: 'verify', q: 'Picatrix Ghayat al-Hakim' },
  { id: 'hermetica-mead',    tag: 'esoteric', license: 'PD', q: 'Thrice Greatest Hermes AND Mead' },
  { id: 'kybalion',          tag: 'esoteric', license: 'PD', q: 'Kybalion AND Three Initiates' },
  { id: 'goetia',            tag: 'esoteric', license: 'PD', q: 'Lesser Key of Solomon Goetia AND Mathers' },
  { id: 'key-of-solomon',    tag: 'esoteric', license: 'PD', q: 'Greater Key of Solomon AND Mathers' },
  { id: 'abramelin',         tag: 'esoteric', license: 'PD', q: 'Sacred Magic of Abramelin the Mage AND Mathers' },
  { id: 'rosicrucian',       tag: 'esoteric', license: 'PD', q: 'Real History of the Rosicrucians AND Waite' },
  { id: 'thelema-holybooks', tag: 'esoteric', license: 'PD', q: 'Liber AL vel Legis Crowley English', skip: 'resolves to Serbian 2025 edition (non-English/copyright)' },

  // ── A. Bedrock under Blavatsky: Neoplatonic / Gnostic / Pythagorean ───────
  { id: 'plotinus-enneads',  tag: 'A-bedrock', license: 'PD', q: 'Plotinus Enneads AND MacKenna' },
  { id: 'proclus',           tag: 'A-bedrock', license: 'PD', q: 'Proclus AND Thomas Taylor' },
  { id: 'iamblichus',        tag: 'A-bedrock', license: 'PD', q: 'Iamblichus Mysteries AND Taylor' },
  { id: 'porphyry',          tag: 'A-bedrock', license: 'PD', q: 'Porphyry Select Works AND Taylor' },
  { id: 'chaldean-oracles',  tag: 'A-bedrock', license: 'PD', q: 'Chaldean Oracles AND (Westcott OR Mead)' },
  { id: 'pistis-sophia',     tag: 'A-bedrock', license: 'PD', q: 'Pistis Sophia AND Mead' },
  { id: 'perfect-way',       tag: 'A-bedrock', license: 'PD', q: 'The Perfect Way AND Kingsford' },
  { id: 'subba-row',         tag: 'A-bedrock', license: 'PD', q: 'Esoteric Writings AND Subba Row' },

  // ── B. Renaissance Hermetic–Kabbalist magic ──────────────────────────────
  { id: 'dee-true-relation', tag: 'B-renaissance', license: 'PD', q: 'True and Faithful Relation AND Dee AND Casaubon' },
  { id: 'dee-monas',         tag: 'B-renaissance', license: 'PD', q: 'Monas Hieroglyphica AND Dee' },
  { id: 'bruno',             tag: 'B-renaissance', license: 'PD', q: 'Heroic Enthusiasts AND Bruno' },
  { id: 'pico-oration',      tag: 'B-renaissance', license: 'PD', q: 'Oration on the Dignity of Man AND Pico' },
  { id: 'reuchlin',          tag: 'B-renaissance', license: 'verify', q: 'De Arte Cabalistica AND Reuchlin' },
  { id: 'trithemius',        tag: 'B-renaissance', license: 'verify', q: 'Steganographia AND Trithemius' },

  // ── C. Kabbalah primary ──────────────────────────────────────────────────
  { id: 'mathers-kabbalah',  tag: 'C-kabbalah', license: 'PD', q: 'Kabbalah Unveiled AND Mathers' },
  { id: 'waite-holy-kabbalah',tag:'C-kabbalah', license: 'PD', q: 'The Holy Kabbalah AND Waite' },
  { id: 'zohar',             tag: 'C-kabbalah', license: 'PD', q: 'Zohar AND (Sperling OR Simon)' },
  { id: 'sefer-yetzirah',    tag: 'C-kabbalah', license: 'PD', q: 'Sepher Yezirah AND Westcott' },

  // ── D. Alchemy ───────────────────────────────────────────────────────────
  { id: 'paracelsus',        tag: 'D-alchemy', license: 'PD', q: 'Hermetic and Alchemical Writings of Paracelsus AND Waite' },
  { id: 'hermetic-museum',   tag: 'D-alchemy', license: 'PD', q: 'Hermetic Museum AND Waite' },
  { id: 'atwood',            tag: 'D-alchemy', license: 'PD', q: 'Suggestive Inquiry into the Hermetic Mystery AND Atwood' },
  { id: 'thomas-vaughan',    tag: 'D-alchemy', license: 'PD', q: 'Works of Thomas Vaughan AND Waite' },
  { id: 'valentine',         tag: 'D-alchemy', license: 'PD', q: 'Triumphal Chariot of Antimony AND Basil Valentine' },
  { id: 'sendivogius',       tag: 'D-alchemy', license: 'PD', q: 'New Chemical Light AND Sendivogius' },

  // ── E. Christian theosophy & Pythagorean number ──────────────────────────
  { id: 'boehme',            tag: 'E-theosophy', license: 'PD', q: 'Signature of All Things AND Boehme' },
  { id: 'swedenborg-heaven', tag: 'E-theosophy', license: 'PD', q: 'Heaven and Hell AND Swedenborg' },
  { id: 'taylor-arithmetic', tag: 'E-theosophy', license: 'PD', q: 'Theoretic Arithmetic AND Thomas Taylor' },
  { id: 'taylor-mysteries',  tag: 'E-theosophy', license: 'PD', q: 'Eleusinian and Bacchic Mysteries AND Taylor' },
  { id: 'orphic-hymns',      tag: 'E-theosophy', license: 'PD', q: 'Mystical Hymns of Orpheus AND Taylor' },

  // ── F. Tarot, Freemasonry, 19th-c. revival ───────────────────────────────
  { id: 'pike-morals',       tag: 'F-revival', license: 'PD', q: 'Morals and Dogma AND Pike' },
  { id: 'mackey',            tag: 'F-revival', license: 'PD', q: 'Encyclopedia of Freemasonry AND Mackey' },
  { id: 'papus-tarot',       tag: 'F-revival', license: 'PD', q: 'Tarot of the Bohemians AND Papus' },
  { id: 'waite-tarot',       tag: 'F-revival', license: 'PD', q: 'Pictorial Key to the Tarot AND Waite' },
  { id: 'hartmann',          tag: 'F-revival', license: 'PD', q: 'Magic White and Black AND Hartmann' },
];
