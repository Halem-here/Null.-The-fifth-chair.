/* Shared times and durations used by the story and evidence cards.
 * Only times stated in a record or by a named speaker belong here. There is no shore-arrival time in the file.
 * tests/run.js checks that other copy stays in step with these values.
 */
(function (root) {
  const G = (root.NULLGAME = root.NULLGAME || {});

  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  // Minutes between two clock times, including across midnight.
  const between = (a, b) => { let d = toMin(b) - toMin(a); if (d < 0) d += 1440; return d; };

  G.FACTS = {
    boat: 'MIST',
    victim: 'Arlo Penn',
    // The 2015 capsize
    t2015: {
      photo: '20:41',      // c01, Teo's photograph
      allSafe: '21:52',    // c02, message sent from Dess's phone
      firstCall: '22:40',  // c03, emergency call log
      recovery: '07:10',   // c05, coroner's note, next morning
    },
    // The 2016 vote
    t2016: {
      arrival: '18:30',    // c07, Nell's text at 18:26
      vote: '22:40',       // c12, vote sheet
      doorBolted: '22:55', // c08, Dess's notebook
      liviaAtDoor: '00:10',// l02, Livia's own account
      noise: '00:40',      // t03, Teo's own account
      dockCamera: '01:15', // c11, camera still
    },
    // The group’s version of the call.
    // No record gives the time they reached shore.
    unsupportedTimes: ['21:25', '9.25', 'twenty-five past nine', 'seventy-five', '75 minutes', '75-minute'],
  };
  G.FACTS.toMin = toMin;
  G.FACTS.between = between;
  G.FACTS.delayMinutes = between(G.FACTS.t2015.allSafe, G.FACTS.t2015.firstCall);   // 48
  G.FACTS.unobservedMinutes = between(G.FACTS.t2016.doorBolted, G.FACTS.t2016.dockCamera); // 140
})(typeof window !== 'undefined' ? window : globalThis);
