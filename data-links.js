/* Links shown on the case board. These describe the records; they do not add evidence or set a verdict.
 * supports: both items back each other (shown as Supported only when both are Fact).
 * consistent: they fit together but do not prove each other. uncertain: the link itself is unverified.
 * Actual conflicts are listed in G.CONTRADICTIONS.
 */
(function (root) {
  const G = (root.NULLGAME = root.NULLGAME || {});
  const F = G.FACTS, T15 = F.t2015;

  G.LINKS = [
    { a: 'c02', b: 'c03', kind: 'supports',
      why: `“All safe.” was sent at ${T15.allSafe}, from the beach. The first call to the emergency line was at ${T15.firstCall}. That is ${F.delayMinutes} minutes later. The text does not show whether a voice call was possible then. The records do not say why the gap happened, or whether the wait changed anything.` },
    { a: 'd02', b: 'c02', kind: 'supports',
      why: 'Dess says the message was hers. The record shows it was sent from her phone.' },
    { a: 'c02', b: 'c04', kind: 'consistent',
      why: `Mr Okafor saw about four people on the beach “some time after nine”, with no time noted. The ${T15.allSafe} message came from that beach. Neither one tells you when the group arrived.` },
    { a: 'c02', b: 'd04', kind: 'uncertain',
      why: 'The text was sent from a beach cell sector at 21:52. That does not show where the phone was earlier, whether voice calls worked there, or when the group could call for help.' },
    { a: 'd01', b: 'c03', kind: 'uncertain',
      why: `Dess says they got to shore and called when they could. The log gives the time of the first call, but not when a voice call became possible. The records do not prove or disprove her timing.` },
    { a: 't02', b: 'c03', kind: 'consistent',
      why: `Teo says Dess wanted everyone to get their stories straight before calling. The log gives the time of the first call, but his account is still just his word.` },
    { a: 'd02', b: 't02', kind: 'consistent',
      why: 'Dess says she sent the text because Mrs Penn kept calling. Teo says Dess wanted the group to agree on what to tell people before calling. Different moments; both are second-hand accounts.' },
    { a: 'd03', b: 'r02', kind: 'uncertain',
      why: 'Dess says Arlo untied the rope. Corin thinks he saw Dess’s hands, but was looking from the shed and says he may be wrong. Neither account is independently confirmed.' },
    { a: 'd03', b: 't01', kind: 'uncertain',
      why: 'Dess says Arlo untied the rope. Teo cannot remember whether he let go or untied it. His uncertainty does not establish that Dess or Arlo was wrong.' },
    { a: 'r02', b: 't01', kind: 'uncertain',
      why: 'Corin thinks he saw Dess’s hands, but says he may be wrong. Teo is unsure what he did. These accounts leave the rope unresolved.' },
    { a: 'l03', b: 'x03', kind: 'uncertain',
      why: 'A SIM in Livia’s coat carried the number that sent the messages to Wren. That does not establish whether it was Nell’s number or whether Livia could reach Nell.' },
    { a: 'r01', b: 'c03', kind: 'uncertain',
      why: 'Corin says he heard they called when they could. He was at the dock, not on the boat, and never checked what he was told.' },
    { a: 'c01', b: 'l01', kind: 'consistent',
      why: 'The photograph shows one person in the water holding another’s arm. Livia says she got Nell to the hull. The photograph does not name anyone.' },
    { a: 'c01', b: 'c05', kind: 'consistent',
      why: `The photograph is from ${T15.photo}. Arlo was found at ${T15.recovery} the next morning. Neither says when he died.` },
    { a: 'n03', b: 'l01', kind: 'supports',
      why: 'Nell’s own text says she is alive because of Livia. Livia says she pulled Nell to the hull.' },
    { a: 'x02', b: 'x04', kind: 'supports',
      why: 'Every message to Wren has a different sign-off from Nell’s own, and every one came from a single prepaid number that was not Nell’s usual number. Neither fact names the sender.' },
    { a: 'x03', b: 'x04', kind: 'supports',
      why: 'The SIM in the coat lining has the number that sent all fourteen messages. That links the SIM to the messages, not to the person who wrote them or to Nell’s location.' },
    { a: 'l04', b: 'x03', kind: 'uncertain',
      why: 'Livia says she used the SIM in her coat to message Wren as Nell. The SIM record connects that card to the sending number; the admission is still her account, not an independent record of who typed each message.' },
    { a: 'x02', b: 'w02', kind: 'supports',
      why: 'Wren remembers that the messages had no dot. The comparison shows it missing from every one.' },
    { a: 'w01', b: 'x01', kind: 'consistent',
      why: 'Wren describes fourteen short “I’m fine.” messages. This is the first of them.' },
    { a: 'n01', b: 'n02', kind: 'consistent',
      why: 'The two handwritten pages follow one another: what she asked for, and what she will do if nobody gives it.' },
    { a: 'n02', b: 't03', kind: 'uncertain',
      why: 'Nell wrote that she had packed. Teo heard something heavy dragged downstairs: “a bag, I think.” Whose bag it was is not shown.' },
    { a: 'n02', b: 'b01', kind: 'uncertain',
      why: 'A depot clerk thinks a girl with a green pack “could have been her”, and says he sees a lot of girls with packs.' },
    { a: 'c06', b: 't01', kind: 'uncertain',
      why: 'An anonymous post accuses Teo with no source. Teo’s own “maybe me” is not an admission. Two unsupported statements do not add up to proof.' },
  ];
})(typeof window !== 'undefined' ? window : globalThis);
