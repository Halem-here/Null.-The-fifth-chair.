/* Puzzles, verdicts, retelling and endings.
 * Times come from G.FACTS. G.ENDING_RULES lists the claims each ending may state;
 * conditional paragraphs are shown only when the player has earned them.
 */
(function (root) {
  const G = (root.NULLGAME = root.NULLGAME || {});
  const F = G.FACTS, T15 = F.t2015, T16 = F.t2016, BOAT = F.boat, DELAY = F.delayMinutes;

  // Timeline puzzle; times use the 24-hour clock.
  G.TIMELINE = {
    events: [
      { t: T16.arrival,     label: 'Nell arrives',                            card: 'c07' },
      { t: T16.vote,        label: 'The vote',                                card: 'c12' },
      { t: T16.doorBolted,  label: 'Front door bolted (Dess’s notebook)',     card: 'c08' },
      { t: T16.liviaAtDoor, label: 'Livia at Nell’s door (Livia’s account)',  card: 'l02' },
      { t: T16.noise,       label: 'Something dragged downstairs (Teo’s account)', card: 't03' },
      { t: T16.dockCamera,  label: 'Dock camera: no boat, no person',         card: 'c11' },
    ],
    question: 'Which stretch of the night has no independent record at all?',
    options: [
      { id: 'tl-a', from: T16.arrival,    to: T16.vote,       label: 'From Nell’s arrival to the vote' },
      { id: 'tl-b', from: T16.doorBolted, to: T16.dockCamera, label: 'From the bolted door to the dock camera', correct: true },
      { id: 'tl-c', from: T16.liviaAtDoor, to: T16.noise,     label: 'From Livia at the door to the noise upstairs' },
      { id: 'tl-d', from: T16.vote,       to: T16.doorBolted, label: 'From the vote to the bolted door' },
    ],
    explain: `From ${T16.doorBolted} to ${T16.dockCamera} is 2 hours 20 minutes. In that time the file has three single sources: Dess’s notebook at ${T16.doorBolted}, Livia at ${T16.liviaAtDoor} and Teo at ${T16.noise}. Each one is a person’s own word. The camera shows one moment at ${T16.dockCamera}. Nothing else covers the gap.`,
    // The file gives no shore-arrival time.
    note2015: `The file does not say when the group reached the shore. It only shows that a phone on the beach sent a message at ${T15.allSafe}, and that the first call was at ${T15.firstCall}. That is ${DELAY} minutes between the two.`,
  };

  // Sign-off puzzle
  G.PAGES = {
    samples: [
      { id: 's1', label: 'Nell, handwritten page', sign: '-- N.' },
      { id: 's2', label: 'Nell, text, Sep 2015',   sign: '-- N.' },
      { id: 's3', label: 'Nell, text, Oct 2016',   sign: '-- N.' },
      { id: 's4', label: 'Message to Wren, Nov 2016', sign: '-- N', copied: true },
      { id: 's5', label: 'Message to Wren, Jan 2017', sign: '-- N', copied: true },
    ],
    question: 'What can you say about the sign-offs on the messages to Wren?',
    options: [
      { id: 'pg-a', label: 'Nell wrote them. She just stopped using the full stop.', result: 'unsupported' },
      { id: 'pg-b', label: 'The sign-offs show that Livia wrote them.', result: 'accuse' },
      { id: 'pg-c', label: 'The sign-off does not match how Nell signed things. That is a reason to doubt she wrote them. On its own it cannot tell me who did, or where Nell is.', result: 'correct' },
      { id: 'pg-d', label: 'The sign-off proves nothing either way.', result: 'shelter' },
    ],
    feedback: {
      correct: 'Yes. A different sign-off is a reason to doubt, not proof of who wrote the messages. Other records have to carry the rest.',
      unsupported: 'That goes further than the pages allow. Every one of Nell’s own sign-offs has the dot, and every message to Wren lacks it. That is not a coincidence you can wave away.',
      accuse: 'The sign-offs say nothing about who wrote the messages. A way of signing can only be compared with another way of signing.',
      shelter: 'It proves something small, not nothing. Fourteen messages in a row, every one without the dot Nell always used, is a pattern. It is a reason to doubt. It is not proof of who wrote them.',
    },
  };

  // Verdict claims
  // needs: Fact cards required to support a TRUE/FALSE verdict.
  // needsAccount: cards that must be in the file and marked Fact or Told.
  // why: explanation shown on the ending page.
  G.CLAIMS = [
    { id: 'k1',  text: `${BOAT} capsized at Greywater, and Arlo Penn was later found drowned.`, correct: 'TRUE', needs: ['c05', 'c01'],
      why: 'The photograph records the capsize. The coroner’s note records that Arlo was later found drowned. It does not give his time of death.' },
    { id: 'k2',  text: 'Livia rescued Nell from the water.', correct: 'TRUE', needs: ['n03', 'c01'], needsAccount: ['l01'],
      why: 'Nell’s own text says she is alive because of Livia. The photograph shows one person holding another in the water. Livia says she did it. No single card proves it, but together they support it.' },
    { id: 'k3',  text: 'The records prove the group could have made an emergency voice call at 21:52.', correct: 'NULL', needs: [],
      why: `The records show a text sent at ${T15.allSafe} and the first emergency call at ${T15.firstCall}, ${DELAY} minutes later. A text does not prove that a voice call was possible then. The file does not establish why the call came later, or whether the delay changed anything.` },
    { id: 'k4',  text: 'Arlo was still alive when “All safe.” was sent.', correct: 'NULL', needs: [],
      why: 'Nothing in the file shows when Arlo died. The coroner’s note gives the cause, not the time.' },
    { id: 'k5',  text: `The file proves who untied ${BOAT}’s rope and that they meant to cause harm.`, correct: 'NULL', needs: [],
      why: 'Dess says Arlo untied it. Corin thinks he saw Dess’s hands. Teo is not sure whether he let go. None of those accounts is independently confirmed, and the file does not show anyone meant harm.' },
    { id: 'k6',  text: 'The 2016 vote was unanimous.', correct: 'FALSE', needs: ['c12'],
      why: 'The vote sheet shows three different answers: two TRUE, two NULL and one FALSE.' },
    { id: 'k7',  text: 'Livia wrote the messages sent to Wren.', correct: 'NULL', correctIf: [{ flag: 'simFound', truth: 'TRUE' }], needs: ['x03'], needsFlag: 'simFound',
      why: 'The different sign-off and number do not identify who wrote the messages. Without Livia’s admission, the sender is unresolved.',
      whyIf: [{ flag: 'simFound', text: 'The SIM in Livia’s coat carried the sending number, and Livia admitted she used it to write the messages as Nell.' }] },
    { id: 'k8',  text: 'Livia knows where Nell is.', correct: 'NULL', needs: [],
      why: 'The SIM card and what Livia told you show that she sent the messages. They do not show she knows where Nell is. She says she does not, and nothing in the file contradicts her.' },
    { id: 'k9',  text: 'Nell is dead.', correct: 'NULL', needs: [],
      why: 'Nothing in the file shows that Nell is dead, and nothing shows that she is alive.' },
    { id: 'k10', text: 'Nell wrote that she had packed and would not come back to the table.', correct: 'TRUE', needs: ['n02'],
      why: 'Page 2, in her own hand, says so. It does not say where she went or whether she got there.' },
  ];

  // Final retelling options
  // Tags group the options by how closely they stick to the evidence.
  // accuse / certain = claims more than the file holds, closed = shuts the question.
  G.RETELL = {
    A: { title: 'What happened',
      options: [
        { id: 'A1', tag: 'agreed', text: 'The wind turned. Nobody could have known.' },
        { id: 'A2', tag: 'hedge',  text: 'A boat capsized and a man died. Beyond that, nobody can say anything.' },
        { id: 'A3', tag: 'owned',  text: `${BOAT} capsized off Greywater. Arlo Penn was later found drowned.` },
        { id: 'A4', tag: 'accuse', text: 'Dess let Arlo die.' },
      ] },
    B: { title: 'What the group did',
      options: [
        { id: 'B1', tag: 'agreed', text: 'We called as soon as we could.' },
        { id: 'B2', tag: 'owned',  text: `“All safe.” was sent at ${T15.allSafe}. The first call for help was at ${T15.firstCall}. That is ${DELAY} minutes later.` },
        { id: 'B3', tag: 'hedge',  text: 'Some time passed. People were in shock.' },
      ] },
    C: { title: 'What we don’t know',
      options: [
        { id: 'C1', tag: 'owned',   text: 'I don’t know whether Arlo was alive when “All safe.” was sent. I don’t know who untied the rope. I don’t know where Nell is.' },
        { id: 'C2', tag: 'certain', text: 'Nell is dead, and Livia knows where.' },
        { id: 'C3', tag: 'closed',  text: 'There is nothing left to know.' },
      ] },
  };

  // Explain when a chosen sentence overstates the evidence.
  G.RETELL_NOTES = {
    agreed:  `You used the group’s own sentence. It leaves out the “All safe.” message at ${T15.allSafe} and the first call at ${T15.firstCall}.`,
    hedge:   'You sheltered behind “nobody can say.” Some things in the file can be said, and a careful account says them.',
    accuse:  'You named a person for something the file does not show. A person can be wrong, or to blame for a message, without being proved to be responsible for a death.',
    certain: 'You stated something about Nell as certain. The file does not show that she is dead, or that Livia knows where she is.',
    closed:  'You closed the question. Several are still open: who untied the rope, whether Arlo was alive at the time of the message, and where Nell is.',
  };

  G.ADDRESSEES = [
    { id: 'five',  label: 'The five of them, at the table' },
    { id: 'wren',  label: 'Wren' },
    { id: 'livia', label: 'Livia' },
    { id: 'nell',  label: 'Nell, wherever she is' },
  ];

  // Scoring thresholds; strikeWrong totals unsupported strikes.
  G.THRESHOLDS = { strikeWrong: 6, trustLetter: 4, trustCard: 2 };

  // Claims each ending must support before it can be shown.
  
  G.ENDING_RULES = {
    core: ['k1', 'k3', 'k4', 'k5', 'k6', 'k7', 'k8', 'k9'],
    // Claims stated by each ending; tests check that they are supported.
    states: {
      'THE FIVE':        ['k1', 'k3', 'k4', 'k5', 'k6', 'k7', 'k8', 'k9'],
      'THE LETTER':      ['k1', 'k3', 'k7', 'k9'],
      'THE CARD':        ['k7', 'k8'],
      'NELL / THE FIVE': ['k1', 'k3', 'k5', 'k6', 'k7', 'k9'],
    },
  };

  // Opening copy and house rules.
  G.INTRO = [
    'A year later, there’s a folder on the Hartwell table. Five chairs are around it. Nell’s place by the window is empty.',
    `In 2015, ${BOAT} capsized off Greywater. Arlo Penn was found drowned the next morning. The other four made it ashore.`,
    'Last October, the five friends met here to vote. Nell had texted to ask them to save her the seat by the window. On her page, she wrote that she wouldn’t come back to the table. The file can’t tell you whether—or when—she left.',
    'You weren’t part of this group. You’ve been asked to read the file and talk to the people in it. TRUE means the evidence supports a claim. FALSE means the evidence contradicts it. NULL means the file can’t settle it.',
    'Start with what you can prove.',
  ];

  // Definitions shown in the briefing and verdict screen.
  G.RULES = {
    TRUE:  'TRUE: reliable evidence supports it.',
    FALSE: 'FALSE: reliable evidence contradicts it.',
    NULL:  'NULL: there is not enough evidence to say either way.',
  };

  G.HOW_TO = [
    'Start with the evidence. Each card tells you what it shows—and what it doesn’t.',
    'Talk to the five. Some will answer only after you’ve found the right card.',
    'Sort the cards: Fact, Told, Guessed or Struck.',
    'Judge the claims. Use Fact cards for TRUE or FALSE; choose NULL when the file can’t settle it.',
    'Choose three sentences. Then decide who needs to hear them.',
  ];

  // A paragraph may depend on an interview flag, a Fact card, or an unlocked card.
  // Keep definite ending statements covered by ENDING_RULES.states or one of those conditions.
  G.ENDINGS = {
    'STRUCK': { title: 'STRUCK', body: [
      'You struck out too much. Some of those records and accounts still hold up.',
      'With those gone, all you have left is the group’s version.',
      'You can tell yourself the file can’t be trusted. The group already does.',
      'Arlo Penn is still dead. That does not depend on whether you agree.' ] },

    'THE SAME SENTENCE': { title: 'THE SAME SENTENCE', body: [
      'You write down what they gave you: the wind turned, nobody could have known, they called as soon as they could.',
      'It goes down easy. Corin nods. Dess thanks you. Teo gives a short laugh, then stops.',
      `The file gives two times their version leaves out: the message went at ${T15.allSafe}; the first call came at ${T15.firstCall}. It doesn’t tell you whether they could have called earlier.`,
      'Nell asked them to say, just once, that it happened. They didn’t. You weren’t at that table, but now you have to decide whether to repeat their version.' ] },

    'NO ANSWER': { title: 'NO ANSWER', body: [
      'You left too much open. Some of it belongs in NULL. But the file does give you answers to a few things.',
      'Your Fact cards didn’t back every TRUE or FALSE you chose. A few answers went further than the file lets you go.',
      'Some questions stay open. That’s not a failure. But don’t call everything NULL when the records do tell you something.',
      'NULL doesn’t mean “nothing happened.” It means the evidence doesn’t let you decide. Say what the file does show, too.' ] },

    'THE FIVE': { title: 'THE FIVE', body: [
      `${BOAT} capsized at Greywater in 2015, and Arlo Penn was later found drowned. At ${T15.allSafe}, a message from Dess’s phone to Mrs Penn said two words: “All safe.” The first call to the emergency line came at ${T15.firstCall}, ${DELAY} minutes later. Nobody can say whether Arlo was still alive when the message was sent, whether a voice call was possible then, or whether the wait changed anything.`,
      { if: { flag: 'dessAdmitted' }, t: 'The text came from Dess’s phone. She told you she sent it because Mrs Penn kept calling. She couldn’t say whether Arlo was safe. That doesn’t prove she untied the rope—or that her message changed what happened.' },
      { if: { has: 't02' }, t: 'Teo says Dess wanted them to agree on what to say before calling. He went along with it. He wishes he hadn’t.' },
      { if: { has: 'd05' }, t: 'Dess told you everyone voted NULL.' },
      'The vote wasn’t unanimous. Dess and Corin voted TRUE; Teo and Livia voted NULL; Nell voted FALSE.',
      { if: { fact: 'x02' }, t: 'The messages to Wren are signed differently from Nell’s pages. That gives you reason to doubt, but doesn’t tell you who sent them.' },
      { if: { fact: 'x04' }, t: 'All fourteen came from one prepaid number. It wasn’t Nell’s usual number. That still doesn’t tell you who sent them.' },
      { if: { fact: 'x03', flag: 'simFound' }, t: 'A SIM card with that number was in Livia’s coat. She told you she used it.' },
      { if: { notFlag: 'simFound' }, t: 'Without Livia’s admission, you still don’t know who sent the messages.' },
      'Three accounts, and none settles who untied the rope: Dess says Arlo did it; Corin thinks he saw Dess’s hands; Teo can’t remember letting go. The forum post names Teo but has nothing behind it. You don’t know where Nell is, or whether she’s alive.',
      'Dess reads your account standing up. Corin reads it again. Teo asks if he can keep a copy. Livia asks if you’ve eaten.',
      'Nell’s place by the window is still empty. The file doesn’t tell you where she went.' ] },

    'THE LETTER': { title: 'THE LETTER', body: [
      'You start the letter four times. On the last try, you stick to what you know.',
      `Arlo was found drowned. A message from Dess’s phone went at ${T15.allSafe}; the first call came at ${T15.firstCall}, ${DELAY} minutes later. That doesn’t tell you whether they could have called sooner. The messages to Wren have a different sign-off and came from a prepaid number, but neither clue tells you who sent them. You don’t know where Nell is. You say that, too.`,
      { if: { fact: 'x03', flag: 'simFound' }, t: 'You tell Wren that Livia admitted using the SIM to write as Nell. You make clear it doesn’t tell you where Nell is.' },
      'Wren writes back: “Thank you. I’ll tell Mrs Penn.” Then, in another message: “I’m not waiting for a fifteenth one.”',
      'The letter doesn’t tell Wren where Nell is. At least she knows what the records say—and what they don’t.' ] },

    'THE CARD': { title: 'THE CARD', body: [
      'You put the SIM card on the table, between the food and Livia’s hand. She doesn’t pick it up.',
      '“I thought if I kept telling Wren Nell was okay, she’d stop worrying.” Livia looks at the SIM. “Maybe I needed to hear it too.”',
      'You tell Livia the SIM links the messages to her phone. It doesn’t tell you where Nell is. She says she doesn’t know. You can’t check that.',
      '“Wren’s been answering those messages thinking they’re from Nell,” you say. “She deserves to know.”',
      'That evening, Livia sends Wren a message under her own name.' ] },

    'NELL / THE FIVE': { title: 'NELL / THE FIVE', body: [
      'You write to Nell, though you don’t know where to send the letter. Wren says she’ll try to get it to her.',
      `You stick to what the file shows. MIST capsized; Arlo Penn was found drowned the next morning. “All safe.” went at ${T15.allSafe}; the first call came at ${T15.firstCall}. The vote wasn’t unanimous.`,
      { if: { fact: 'x02' }, t: 'The sign-off is different from yours. It gives a reason to doubt, but doesn’t tell who sent the messages.' },
      { if: { fact: 'x04' }, t: 'The messages came from one prepaid number, not your usual one. That still doesn’t tell who used it.' },
      { if: { fact: 'x03', flag: 'simFound' }, t: 'Livia admitted she used the SIM to write those messages as you.' },
      { if: { notFlag: 'simFound' }, t: 'The file does not establish who wrote the messages.' },
      'You also write down what the file can’t tell you: who untied the rope, whether the wait mattered, where Nell went, or whether she’s alive.',
      'At the end, you write the words Nell asked for: It happened.',
      'Wren doesn’t know whether Nell will read the letter. At the Hartwell table, Nell’s place by the window stays empty.' ] },
  };
})(typeof window !== 'undefined' ? window : globalThis);
