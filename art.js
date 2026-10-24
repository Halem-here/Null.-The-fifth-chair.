/* Presentation data for the cards, people, places and endings. Game rules live elsewhere.
 * Keep descriptions grounded in the records and interviews. Image paths are relative to this project.
 */
(function (root) {
  const G = (root.NULLGAME = root.NULLGAME || {});
  const ART = (G.ART = {});

  // People
  ART.PEOPLE = {
    nell:  { name: 'Nell Ashby',    img: 'assets/portraits/nell.svg',  tag: 'Wrote that she planned to leave in October 2016. The file cannot confirm whether she left.', alt: 'Portrait of Nell: dark hair, a muted red scarf.' },
    dess:  { name: 'Dess Hartwell', img: 'assets/portraits/dess.svg',  tag: 'Keeps the folder in the order she wants it read.', alt: 'Portrait of Dess: hair in a bun, a folder in front of her.' },
    corin: { name: 'Corin Vale',    img: 'assets/portraits/corin.svg', tag: 'Keeps the vote sheet. Was not on the boat.', alt: 'Portrait of Corin: round glasses, a legal pad turned face down.' },
    teo:   { name: 'Teo Brandt',    img: 'assets/portraits/teo.svg',   tag: 'Took the 20:41 photograph.', alt: 'Portrait of Teo: curly hair, stubble, a mug in front of him.' },
    livia: { name: 'Livia Marsh',   img: 'assets/portraits/livia.svg', tag: 'Has made too much food.', alt: 'Portrait of Livia: wavy hair, a plate in front of her.' },
    wren:  { name: 'Wren Ward',     img: 'assets/portraits/wren.svg',  tag: 'Nell’s younger sister. Speaks by phone.', alt: 'Portrait of Wren: a bob with bangs, a phone lit in her hand.' },
  };

  // Card presentation
  // kind selects the drawing; label, when and origin describe the source.
  const R = 'record', A = 'account';
  ART.CARDS = {
    c01: { kind: 'photo',   label: 'Photograph',          when: '20:41',                    origin: 'Taken on Teo’s phone', from: R, img: 'assets/evidence/photo-c01.svg', alt: 'A phone photograph at dusk. A dinghy named MIST lies on its side. One person is on the hull. Two heads are in the water; one person holds the other’s arm.' },
    c02: { kind: 'message', label: 'Message record',      when: '21:52',                    origin: 'Sent from Dess’s phone to Mrs Penn', from: R, to: 'Mrs Penn', meta: 'Phone on the Greywater beach cell sector' },
    c03: { kind: 'log',     label: 'Emergency call log',  when: '22:40',                    origin: 'Call from the Hartwell landline', from: R, head: ['EMERGENCY CALL LOG', 'FIRST CALL RECEIVED'] },
    c04: { kind: 'statement', label: 'Statement', when: 'Some time after nine (no time noted)', origin: 'Mr Okafor, lake road', from: A, head: 'STATEMENT · MR OKAFOR' },
    c05: { kind: 'statement', label: 'Coroner’s note',    when: '07:10 the next morning', origin: 'East shore', from: R, head: 'CORONER’S NOTE' },
    c06: { kind: 'post',    label: 'Forum post',          when: 'Eleven days after the capsize', origin: 'Account since deleted', from: A, user: '[account deleted]' },
    c07: { kind: 'message', label: 'Text message',        when: '18:26 · October 2016',     origin: 'Sent to the house group', from: R, to: 'House group', meta: 'No arrival time is recorded' },
    c08: { kind: 'notebook', label: 'Notebook entry',     when: '22:55',                    origin: 'In Dess’s handwriting', from: R },
    c11: { kind: 'photo',   label: 'Camera still',        when: '01:15 · October 2016',     origin: 'Dock light camera', from: R, img: 'assets/evidence/cam-c11.svg', alt: 'A single camera frame of the dock at night: planks, a post, the water. No boat and no person.' },
    c12: { kind: 'vote',    label: 'Vote sheet',          when: '22:40',                    origin: 'In Corin’s handwriting', from: R },
    b01: { kind: 'statement', label: 'Depot clerk',       when: 'Two days after the vote',           origin: 'Bus depot', from: A, head: 'STATEMENT · DEPOT CLERK' },
    n01: { kind: 'handwritten', label: 'Handwritten page', when: 'Page 1',                  origin: 'Nell’s own hand', from: R },
    n02: { kind: 'handwritten', label: 'Handwritten page', when: 'Page 2',                  origin: 'Nell’s own hand', from: R },
    n03: { kind: 'message', label: 'Text message',        when: 'September 2015',           origin: 'Sent to Livia', from: R, to: 'Livia' },
    x01: { kind: 'message', label: 'Message to Wren',     when: '4 November 2016',          origin: 'Received by Wren', from: A, to: 'Wren', inbound: true },
    x02: { kind: 'compare', label: 'Comparison',          when: 'Nell’s own sign-offs against the messages to Wren', origin: 'Compared character by character', from: R },
    x03: { kind: 'sim',     label: 'Physical item',       when: 'Found in the lining of a coat',   origin: 'Livia’s coat', from: R, img: 'assets/evidence/sim.svg', alt: 'A prepaid SIM card.' },
    x04: { kind: 'log',     label: 'Sender metadata',     when: 'All fourteen messages',    origin: 'Forwarded by Wren', from: R, head: ['SENDER METADATA', 'ALL FOURTEEN MESSAGES'] },
  };
  // Show interview testimony as a transcript.
  const SPEAKERS = { d: 'dess', r: 'corin', t: 'teo', l: 'livia', w: 'wren' };
  ART.cardMeta = function (card) {
    const own = ART.CARDS[card.id];
    if (own) return Object.assign({ id: card.id }, own);
    const who = SPEAKERS[card.id[0]];
    return { id: card.id, kind: 'testimony', label: 'Interview', when: 'Told to you in an interview', origin: ART.PEOPLE[who].name, from: A, speaker: who };
  };

  ART.SOURCE_LABEL = { records: 'Records', nell: 'Nell', dess: 'Dess Hartwell', corin: 'Corin Vale', teo: 'Teo Brandt', livia: 'Livia Marsh', wren: 'Wren Ward', copied: 'The messages to Wren' };
  ART.SOURCE_PERSON = { nell: 'nell', dess: 'dess', corin: 'corin', teo: 'teo', livia: 'livia', wren: 'wren' };

  // Short definitions shown on cards and in the inspector.
  ART.CLASS_MEANING = {
    fact:    'A record, or something the records back up.',
    told:    'One person’s account. It may be true, but nobody has checked it.',
    guessed: 'A claim or rumour with nothing solid behind it. Unproven does not mean false.',
    struck:  'Contradicted by a Fact card. It stays out of the story.',
  };

  // Notes say what each item shows and where its evidence ends; they do not assign a class.
  ART.NOTES = {
    c01: { shows: 'A boat on its side at 20:41. One person on the hull. One person in the water holding another’s arm.', limit: 'It does not show who anyone is, or where Arlo was.' },
    c02: { shows: 'A phone on the beach sent “All safe.” at 21:52.', limit: 'It does not show whether Arlo was alive, or what Dess knew.' },
    c03: { shows: 'The first call to the emergency line came at 22:40.', limit: 'It does not show when the group reached the shore, or why they waited.' },
    c04: { shows: 'Someone outside the group saw about four people on the beach after nine.', limit: 'No time was noted. It does not say when they arrived.' },
    c05: { shows: 'Arlo drowned and was found at 07:10 the next morning.', limit: 'It does not give a time of death.' },
    c06: { shows: 'Someone posted a rumour about Teo.', limit: 'There is no name, no source and no evidence behind it.' },
    c07: { shows: 'At 18:26, Nell texted that she was nearly there.', limit: 'The file gives no record of when she arrived.' },
    c08: { shows: 'Dess wrote that the front door was bolted at 22:55.', limit: 'It does not say who bolted it. It is Dess’s own note.' },
    c11: { shows: 'No boat and no person at the dock at 01:15.', limit: 'One moment only. It does not show where anyone went, or anything about Nell’s phone.' },
    c12: { shows: 'How each of the five voted.', limit: 'It does not say why anyone voted as they did.' },
    b01: { shows: 'A clerk thinks he saw a girl with a green pack buy a ticket north.', limit: 'He is not sure it was Nell. It does not show she took that bus.' },
    n01: { shows: 'What Nell asked of the group.', limit: 'It does not say where she went or what she did next.' },
    n02: { shows: 'Nell wrote that she had packed, and would not come back unless someone said it happened.', limit: 'It does not show where she went, or whether she got there.' },
    n03: { shows: 'Nell wrote that she was alive because of Livia.', limit: 'It does not say how Livia saved her.' },
    d01: { shows: 'What Dess says the group did after they reached the beach.', limit: 'It is one person’s account.' },
    d02: { shows: 'Dess says she sent the message, and did not know it was true.', limit: 'It does not show what she thought about Arlo, or why nobody called sooner.' },
    d03: { shows: 'Dess says Arlo untied the rope himself.', limit: 'It is one account, and others disagree. Nobody has confirmed it.' },
    d04: { shows: 'Dess’s account of mobile signal after the capsize.', limit: 'The 21:52 text does not establish where the phone was earlier or whether voice calls were possible.' },
    d05: { shows: 'Dess’s memory of how the vote went.', limit: 'It is her memory, not the record of the vote.' },
    r01: { shows: 'Corin’s version of what the group did.', limit: 'Corin was at the dock. He did not see it himself.' },
    r02: { shows: 'Corin says he saw hands at the rope, and thinks they were Dess’s.', limit: 'He saw only hands, from the shed. He says he is fairly sure, not certain.' },
    t01: { shows: 'Teo says he may have been holding the rope.', limit: 'He does not remember. A “maybe” is not an admission.' },
    t02: { shows: 'Teo says what Dess told the group on the beach, and that he did not argue.', limit: 'It is Teo’s memory. Nobody else has confirmed it.' },
    t03: { shows: 'Teo heard a door and something heavy dragged, at about 00:40.', limit: 'He did not see it. He thinks it was a bag.' },
    l01: { shows: 'Livia says she got Nell to the hull, then went back for Arlo.', limit: 'It is Livia’s own account.' },
    l02: { shows: 'Livia says she went to Nell’s door at about 00:10.', limit: 'It is Livia’s own account. Nobody else saw it.' },
    l03: { shows: 'Livia says she no longer has Nell’s number.', limit: 'The SIM linked to messages for Wren does not establish that it was Nell’s number or a way to reach her.' },
    l04: { shows: 'Livia says she used the SIM in her coat to message Wren as Nell.', limit: 'This is her account of what she did. It does not show where Nell is or whether Livia knows.' },
    w01: { shows: 'Wren says she has received fourteen short messages since last November.', limit: 'It shows what Wren received. It does not show who sent them.' },
    w02: { shows: 'Wren remembers that Nell always used the dot.', limit: 'It is Wren’s memory of Nell’s habit.' },
    x01: { shows: 'The first message Wren received.', limit: 'It does not show who sent it.' },
    x02: { shows: 'The messages to Wren are signed differently from Nell’s own writing.', limit: 'A different sign-off is a reason to doubt, not proof of who wrote them.' },
    x03: { shows: 'A SIM card in Livia’s coat has the number that sent the messages.', limit: 'It does not show who wrote them, or where Nell is.' },
    x04: { shows: 'The phone company says all fourteen messages came from one prepaid number, not Nell’s usual number.', limit: 'It does not identify who used the number, or say what became of Nell.' },
  };


  // Places
  ART.PLACES = [
    { id: 'greywater', name: 'Greywater beach', img: 'assets/places/greywater.svg', alt: 'A grey stone beach at dusk, still water, a distant buoy.',
      text: 'The beach where the four who survived came ashore. Mr Okafor says he saw about four people sitting here “some time after nine, not moving much.” The 21:52 message was sent from this beach’s cell sector.',
      cards: ['c02', 'c04', 'd01', 'd04', 't02'], people: ['dess', 'teo', 'livia'] },
    { id: 'house', name: 'The Hartwell house', img: 'assets/places/house.svg', alt: 'A lake house at night with lit windows on the ground floor.',
      text: 'The lake house where the five friends met to vote in October 2016. A year later, Nell’s place by the window is empty. The first emergency call in 2015 came from the house landline. At 18:26 Nell texted that she was nearly there. The file does not record when she arrived. The vote was at 22:40; Dess’s notebook records the front door bolted at 22:55.',
      cards: ['c03', 'c07', 'c12', 'c08', 'l02', 't03', 'd05'], people: ['dess', 'corin', 'teo', 'livia'] },
    { id: 'dock', name: 'The dock and boat shed', img: 'assets/places/dock.svg', alt: 'A wooden dock running into dark water, a post with a dim red lamp, a boat shed on the bank.',
      text: 'Corin says MIST left at about a quarter past seven, and that he stayed at the dock. He says he was in the shed, looking for the bailer, when he saw hands at the rope. The dock light camera has one frame from 01:15 on the night of the vote.',
      cards: ['c11', 'r01', 'r02', 'd03', 't01'], people: ['corin', 'dess', 'teo'] },
    { id: 'eastshore', name: 'The east shore', img: 'assets/places/eastshore.svg', alt: 'Reeds along a pale lake in early morning mist.',
      text: 'Arlo Penn was found here at 07:10 the next morning. Cause of death: drowning.',
      cards: ['c05'], people: [] },
    { id: 'lakeroad', name: 'The lake road', img: 'assets/places/lakeroad.svg', alt: 'A gravel road beside the lake, a fence, a mailbox, dark pines.',
      text: 'Mr Okafor lives by the lake road. He is not one of the group. He did not note the time.',
      cards: ['c04'], people: [] },
    { id: 'depot', name: 'The bus depot', img: 'assets/places/busdepot.svg', alt: 'A bus shelter at first light, an empty bench, a timetable board.',
      text: 'Two days after the vote, a clerk remembers “a girl with a green pack, early morning,” buying a ticket north. He says it could have been her, and that he sees a lot of girls with packs.',
      cards: ['b01'], people: [] },
  ];

  // Cards connected to each claim
  ART.CLAIM_CARDS = {
    k1: ['c05', 'c01'], k2: ['c01', 'l01', 'n03'], k3: ['c02', 'c03'], k4: ['c02', 'd02'],
    k5: ['d03', 'r02', 't01', 'c06'], k6: ['c12', 'd05'], k7: ['x02', 'x04', 'x03', 'w02', 'x01', 'l04'],
    k8: ['l02', 'l03', 'x03', 'l04'], k9: ['n02', 'b01', 'c11'], k10: ['n02', 'n01', 't03'],
  };

  // Ending artwork and page style
  ART.ENDINGS = {
    'STRUCK':            { img: 'assets/endings/struck.svg',            kicker: 'You struck too much.',            tone: 'red',   alt: 'A page covered in black bars and red strokes, a photograph missing.' },
    'THE SAME SENTENCE': { img: 'assets/endings/the-same-sentence.svg', kicker: 'You repeated the group’s line.',        tone: 'grey',  alt: 'Five identical chairs under one lamp, the same sentence written over and over.' },
    'NO ANSWER':         { img: 'assets/endings/no-answer.svg',         kicker: 'You stopped short of an answer.',   tone: 'grey',  alt: 'A closed folder and a blank page under a lamp.' },
    'THE FIVE':          { img: 'assets/endings/the-five.svg',          kicker: 'You said what the file shows.',           tone: 'paper', alt: 'Five chairs at a table. Nell’s place by the window is empty.' },
    'THE LETTER':        { img: 'assets/endings/the-letter.svg',        kicker: 'You wrote to Wren.',                   tone: 'paper', alt: 'A letter, an envelope and a pen on a table, a phone beside them.' },
    'THE CARD':          { img: 'assets/endings/the-card.svg',          kicker: 'You put the card on the table.',       tone: 'red',   alt: 'A SIM card on the table beside a plate of food, a hand reaching in from the right.' },
    'NELL / THE FIVE':   { img: 'assets/endings/nell-the-five.svg',     kicker: 'You wrote it to Nell.',                tone: 'paper', alt: 'Five chairs at a table before a window onto the lake. Nell’s chair by the window is empty.' },
  };

  ART.HERO = { img: 'assets/places/hero.svg', alt: 'A lake house at night. One window is lit, and five chairs stand round a table inside.' };

  // Return every image path used by the game.
  ART.allImages = function () {
    const set = new Set([ART.HERO.img]);
    Object.values(ART.PEOPLE).forEach((p) => set.add(p.img));
    Object.values(ART.CARDS).forEach((c) => c.img && set.add(c.img));
    ART.PLACES.forEach((p) => set.add(p.img));
    Object.values(ART.ENDINGS).forEach((e) => set.add(e.img));
    return [...set];
  };
})(typeof window !== 'undefined' ? window : globalThis);
