/* Card data shared by the game and tests.
 * truth: fact = backed by a record; told = one person's account; guessed = unsupported;
 * struck = contradicted by a Fact card. Unproven does not mean false.
 * truthIf changes a card's class after an interview flag is set. weight sets the cost of a wrong strike.
 * Times come from G.FACTS, and quoted accounts must match the interview that unlocks them.
 */
(function (root) {
  const G = (root.NULLGAME = root.NULLGAME || {});
  const F = G.FACTS, T15 = F.t2015, T16 = F.t2016;

  G.SOURCES = {
    records: { name: 'Records', note: 'Logs, photographs, documents.' },
    nell:    { name: 'Nell',    note: 'Handwritten pages and her old texts.' },
    dess:    { name: 'Dess Hartwell' },
    corin:   { name: 'Corin Vale' },
    teo:     { name: 'Teo Brandt' },
    livia:   { name: 'Livia Marsh' },
    wren:    { name: 'Wren Ward' },
    copied:  { name: 'The messages to Wren' },
  };

  G.HOUSE_RULE_4 = 'A claim nobody can prove is NULL, not FALSE.'; // PROVISIONAL wording

  G.CARDS = [
    // Records available at the start
    { id: 'c01', source: 'records', title: `Photograph, ${T15.photo}`, start: true, truth: 'fact', weight: 2,
      text: `Taken on Teo’s phone. The boat, ${F.boat}, is on its side. One person is on the hull. One person is in the water, holding another person’s arm. Nobody else is in the frame.` },
    { id: 'c02', source: 'records', title: `Message to Mrs Penn, ${T15.allSafe}`, start: true, truth: 'fact', weight: 2,
      text: `Sent from Dess’s phone. Two words: “All safe.” At ${T15.allSafe} the phone was on the Greywater beach cell sector.` },
    { id: 'c03', source: 'records', title: 'Emergency call log', start: true, truth: 'fact', weight: 2,
      text: `The first call to the emergency line was received at ${T15.firstCall}. It came from the Hartwell landline.` },
    { id: 'c04', source: 'records', title: 'Mr Okafor’s statement', start: true, truth: 'told', weight: 1,
      text: 'Mr Okafor lives on the lake road. He says he saw about four people sitting on Greywater beach “some time after nine, not moving much.” He did not note the time.' },
    { id: 'c05', source: 'records', title: 'Coroner’s note', start: true, truth: 'fact', weight: 2,
      text: `Arlo Penn was found at ${T15.recovery} the next morning, on the east shore. Cause of death: drowning. The note does not say when he died.` },
    { id: 'c06', source: 'records', title: 'Forum post: “teo untied the rope”', start: true, truth: 'guessed', weight: 1,
      text: 'Posted eleven days after the capsize by an account that has since been deleted: “teo untied the rope, everyone knows.” There are no replies, no evidence and no name.' },
    { id: 'c07', source: 'records', title: 'Nell’s text, 18:26, October 2016', start: true, truth: 'fact', weight: 1,
      text: `Sent to the house group: “nearly there. save me the seat by the window. -- N.” The file puts her arrival at the house at about ${T16.arrival}.` },
    { id: 'c08', source: 'records', title: `Dess’s notebook, ${T16.doorBolted}`, start: true, truth: 'told', weight: 1,
      text: `A page in Dess’s handwriting: “front door bolted ${T16.doorBolted}.” It does not say who bolted it. It is the only record that the door was bolted.` },
    { id: 'c11', source: 'records', title: `Dock light camera, ${T16.dockCamera}`, start: true, truth: 'fact', weight: 2,
      text: `One still frame, taken at ${T16.dockCamera}. It shows the dock, the post and the water. No boat and no person. It does not show what happened before or after.` },
    { id: 'c12', source: 'records', title: `Vote sheet, ${T16.vote}`, start: true, truth: 'fact', weight: 2,
      text: 'In Corin’s handwriting. Statement: “What happened to Arlo was nobody’s fault.” Dess TRUE. Corin TRUE. Teo NULL. Livia NULL. Nell FALSE.' },
    { id: 'b01', source: 'records', title: 'Bus depot clerk', start: true, truth: 'guessed', weight: 1,
      text: 'Two days after the vote, a clerk at the bus depot said: “A girl with a green pack, early morning, bought a ticket north. Could have been her. I see a lot of girls with packs.”' },

    // Nell’s pages
    { id: 'n01', source: 'nell', title: 'Page 1, handwritten', start: true, truth: 'fact', weight: 2,
      text: '“I’d like one of you to say it happened. That’s all I want. Not why. Not whose. -- N.”' },
    { id: 'n02', source: 'nell', title: 'Page 2, handwritten', start: true, truth: 'fact', weight: 2,
      text: '“If nobody will, I’m not coming back to the table. I’ve packed. Wren knows where I’ll be, or will. -- N.”' },
    { id: 'n03', source: 'nell', title: 'Text to Livia, Sep 2015', start: true, truth: 'fact', weight: 1,
      text: '“ok. i’m alive because of you. i don’t know what to do with that. -- N.”' },

    // Dess’s interview
    { id: 'd01', source: 'dess', title: 'Dess: “when we could”', truth: 'told', weight: 1,
      text: '“We got ashore and called when we could.”' },
    { id: 'd02', source: 'dess', title: 'Dess on “All safe.”', truth: 'told', weight: 2,
      text: '“His mother kept calling. I sent “All safe.” to get her to stop. I didn’t know if he was safe. I know how that sounds.”' },
    { id: 'd03', source: 'dess', title: 'Dess on the rope', truth: 'told', weight: 1,
      text: '“Arlo untied it. He was always messing with that rope.”' },
    { id: 'd04', source: 'dess', title: 'Dess: no signal', truth: 'struck', weight: 1,
      text: '“There wasn’t any signal down there. We had to get up to the house to call.”' },
    { id: 'd05', source: 'dess', title: 'Dess on the vote', truth: 'struck', weight: 1,
      text: '“We all wrote NULL. None of us knew what had happened. That’s what the rule is for.”' },

    // Corin’s interview
    { id: 'r01', source: 'corin', title: 'Corin: what he heard', truth: 'guessed', weight: 1,
      text: '“I heard they called when they could. That’s all I know.” Corin was at the dock, not on the boat.' },
    { id: 'r02', source: 'corin', title: 'Corin on the rope', truth: 'told', weight: 1,
      text: '“Dess. I think. I was in the shed, looking for the bailer. I only saw hands.”' },

    // Teo’s interview
    { id: 't01', source: 'teo', title: 'Teo on the rope', truth: 'guessed', weight: 1,
      text: '“Could’ve been me, I guess. I had hold of the rope, then I didn’t. I can’t remember letting go. Don’t know if I untied it or just lost hold.”' },
    { id: 't02', source: 'teo', title: 'Teo on the beach', truth: 'told', weight: 2,
      text: '“Dess said, ‘Let’s get our stories straight before we call anyone.’ She said we’d look worse if we all said different things. I just went along with it. I didn’t say anything.”' },
    { id: 't03', source: 'teo', title: `Teo, upstairs, ${T16.noise}`, truth: 'told', weight: 1,
      text: '“I heard a door, then something heavy coming down the stairs. A bag, maybe. I stayed in my room.”' },

    // Livia’s interview
    { id: 'l01', source: 'livia', title: 'Livia on the rescue', truth: 'told', weight: 2,
      text: '“Nell got caught under the sail. I reached her, got her to the hull, then went back for Arlo. Twice. Couldn’t find him.”' },
    { id: 'l02', source: 'livia', title: `Livia at the door, ${T16.liviaAtDoor}`, truth: 'told', weight: 1,
      text: '“I went to her door just after midnight. She told me to go away. She seemed calm. I told myself she was fine.”' },
    { id: 'l03', source: 'livia', title: 'Livia: no number', truth: 'told', weight: 1,
      truthIf: [{ flag: 'simFound', truth: 'struck' }],
      text: '“I don’t have her number any more.”' },

    // Wren’s interview
    { id: 'w01', source: 'wren', title: 'Wren on the messages', truth: 'told', weight: 1,
      text: '“Since last November, I’ve had fourteen messages. All short. All “I’m fine.””' },
    { id: 'w02', source: 'wren', title: 'Wren on the sign-off', truth: 'told', weight: 1,
      text: '“Nell always put a dot after her name. Notes, texts, even receipts. These messages didn’t have one. I told myself it was just the phone. I wanted them to be from her.”' },

    // Messages sent to Wren
    { id: 'x01', source: 'copied', title: 'Message to Wren, 4 Nov 2016', truth: 'told', weight: 1,
      truthIf: [{ flag: 'copiedProved', truth: 'struck' }],
      text: '“I’m fine. Don’t look for me. -- N”' },
    { id: 'x02', source: 'copied', title: 'Sign-off comparison', truth: 'fact', weight: 2,
      text: 'Nell’s pages and her own texts end “-- N.” The fourteen messages to Wren end “-- N”. Every one, with no exception.' },
    { id: 'x03', source: 'copied', title: 'Prepaid SIM card', truth: 'fact', weight: 2,
      text: 'A prepaid SIM card was found in the lining of Livia’s coat. Its number is the number that sent the messages to Wren.' },
    { id: 'x04', source: 'copied', title: 'Sender metadata', truth: 'fact', weight: 2,
      text: 'All fourteen messages came from one prepaid number, not Nell’s usual number. Wren got this from the phone company and forwarded it.' },
  ];

  // These pairs conflict. Show the player; never resolve them automatically.
  G.CONTRADICTIONS = [
          { a: 'd04', b: 'c02', why: '“All safe.” was sent from the beach, so the phone had signal there.' },
    { a: 'd05', b: 'c12', why: 'The vote sheet shows three different answers: two TRUE, two NULL and one FALSE.' },
    { a: 'd03', b: 'r02', why: 'Dess says Arlo untied it. Corin says it was Dess. They cannot both be right.' },
    { a: 'd03', b: 't01', why: 'Dess says Arlo untied it. Teo says it may have been him.' },
    { a: 'r02', b: 't01', why: 'Corin says it was Dess. Teo says it may have been him.' },
    { a: 'l03', b: 'x03', why: 'A SIM card in her coat has the number that sent the messages to Wren.' },
  ];
})(typeof window !== 'undefined' ? window : globalThis);
