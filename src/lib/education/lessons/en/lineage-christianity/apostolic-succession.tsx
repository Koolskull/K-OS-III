import { Lead, P, H2, UList, Li, Em } from "@/components/doc/elements";
import { Diagram } from "@/components/doc/Diagram";

export default function ApostolicSuccession() {
  return (
    <>
      <Lead>
        Apostolic succession is the claim that the authority Christ
        gave to the Twelve travels through history by one specific
        mechanism — the <Em>laying on of hands</Em>, bishop to bishop,
        in an unbroken chain of ordinations from the first century to
        the priest at the altar this Sunday. The Catholic, Orthodox,
        and Anglican traditions each affirm the doctrine and each
        describe the chain in their own terms; this entry sets out
        the textual witness, the key vocabulary, and the points at
        which the three readings part company, on the terms each
        tradition uses for itself.
      </Lead>

      <H2>Vocabulary, briefly</H2>

      <P>
        The doctrine has its own technical language, and the argument
        is hard to follow without it. The <Em>episcopate</Em> is the
        office of bishop (Greek <Em>episkopos</Em>, &ldquo;overseer&rdquo;);
        the <Em>presbyteral</Em> order is the rank of priest below the
        bishop. <Em>Petrine primacy</Em> is the Catholic claim that the
        bishop of Rome inherits a unique authority from Peter as head
        of the Twelve. <Em>Autocephaly</Em> (Greek &ldquo;self-headed&rdquo;)
        is the Orthodox structural principle by which fourteen or so
        national churches are each fully self-governing under their
        own patriarch while remaining in full eucharistic communion
        with one another. <Em>Laying on of hands</Em> (Greek{" "}
        <Em>cheirotonia</Em>) is the sacramental gesture, with
        prescribed prayers, by which a bishop already in the
        succession ordains the next. The chain is made of these
        gestures.
      </P>

      <H2>The earliest witnesses</H2>

      <P>
        The <Em>First Epistle of Clement</Em>, written from Rome to
        the Corinthian church around 96 AD — within a generation of
        the apostolic period — already treats the episcopate as a
        continuity established by apostolic appointment. Chapter 44
        states that the Apostles, &ldquo;having received perfect
        foreknowledge, appointed those mentioned before, and
        afterwards gave instructions, that when these should fall
        asleep, other approved men should succeed them in their
        ministry.&rdquo; Ignatius of Antioch, writing around 107 AD
        on his way to martyrdom in Rome, addresses the bishops of the
        churches he passes through as the visible centre of the local
        eucharistic assembly: <Em>&ldquo;Wherever the bishop shall
        appear, there let the multitude be; even as wherever Jesus
        Christ is, there is the Catholic Church.&rdquo;</Em> The
        doctrine is not being defended in these texts; it is assumed.
      </P>

      <P>
        Irenaeus of Lyons, in Book III of <Em>Against Heresies</Em>{" "}
        (c. 180 AD), sets out what remains the classical argument:
        the authentic faith is distinguished from the Gnostic
        alternatives not by private revelation but by public
        continuity. In III.3 Irenaeus lists the bishops of Rome from
        Linus (ordained by Peter and Paul) through Anacletus (also
        called Cletus), Clement, and onward to Eleutherius, his own
        contemporary, as the visible demonstration that the Roman
        church teaches what the Apostles taught. The list is the form
        of the argument: because the succession is public, the
        teaching is checkable. Hegesippus, in the same period,
        compiled a parallel list of successions at Jerusalem. The
        Council of Nicaea (325 AD), some hundred and forty years
        later, presupposed this episcopal structure and legislated
        for it rather than against it — its canons govern the
        relations between bishops who are already the architecture of
        the Church.
      </P>

      <H2>The shape of the chain</H2>

      <Diagram
        cols={7}
        rows={1}
        nodes={[
          { id: "christ", text: "CHRIST", col: 0, row: 0 },
          { id: "apostles", text: "APOSTLES", col: 1, row: 0, sub: "1st c." },
          { id: "linus", text: "LINUS", col: 2, row: 0, sub: "Rome I" },
          { id: "anacletus", text: "ANACLETUS", col: 3, row: 0, sub: "Rome II" },
          { id: "clement", text: "CLEMENT", col: 4, row: 0, sub: "c. 96 AD" },
          { id: "dots", text: "...", col: 5, row: 0, sub: "unbroken" },
          { id: "present", text: "PRESENT", col: 6, row: 0, accent: true, sub: "this Sunday" },
        ]}
        edges={[
          { from: "christ", to: "apostles", label: "commissions" },
          { from: "apostles", to: "linus", label: "ordain" },
          { from: "linus", to: "anacletus", label: "hands" },
          { from: "anacletus", to: "clement", label: "hands" },
          { from: "clement", to: "dots", label: "hands" },
          { from: "dots", to: "present", label: "hands", accent: true },
        ]}
        caption="APOSTOLIC SUCCESSION — UNBROKEN CHAIN OF LAYING ON OF HANDS."
      />

      <P>
        An apostolic succession is transmitted by the sacramental
        action of ordination — specifically, by the laying on of
        hands by at least one bishop who himself stands in the
        succession, accompanied by the prescribed prayers of the
        ordaining church. The resulting ordination is, in the
        sacramental logic of the tradition, an ontological change in
        the man ordained: he becomes, and permanently remains, a
        bishop, such that every subsequent sacrament he conducts —
        eucharist, ordination, chrismation — carries the apostolic
        authority through his hands. A single line of succession is
        therefore a single thread of sacred history running from
        Christ through the Apostles, through every intermediate
        bishop, into the present moment&apos;s liturgy.
      </P>

      <H2>Three readings of the chain</H2>

      <P>
        The Catholic reading places the bishop of Rome at the centre
        of the structure: every valid bishop is in succession from
        an Apostle, but the successor of Peter holds a primacy of
        jurisdiction over the whole Church, and full communion with
        the see of Rome is part of what it means to stand in the
        succession in its complete form. The Orthodox reading affirms
        the same ordination chain and the same sacramental theology
        but rejects Petrine primacy as it developed in the West;
        authority is held collegially among autocephalous patriarchs
        — Constantinople, Alexandria, Antioch, Jerusalem, Moscow, and
        the rest — each a self-headed church in eucharistic communion
        with the others. The mutual recognition between Catholic and
        Orthodox ordinations survived the Great Schism of 1054 and
        persists to the present, even where communion does not.
      </P>

      <P>
        The Anglican reading holds that the English church preserved
        the historic episcopate through the Reformation, that the
        consecration of Matthew Parker in 1559 stood in valid
        succession, and that the Anglican episcopate today is the
        same ordination chain by another name. The papal bull{" "}
        <Em>Apostolicae Curae</Em> of Leo XIII (1896) declared
        Anglican ordinations <Em>&ldquo;absolutely null and utterly
        void&rdquo;</Em> on the ground that the Edwardine ordinal had
        altered the intent and form of the rite; the Anglican response
        (<Em>Saepius Officio</Em>, 1897) contested both the historical
        and the theological premises and remains the standard reply.
        The Old Catholic churches of the Utrecht Union, separated
        from Rome after the First Vatican Council, retain
        ordinations that Rome itself recognises as valid; through
        their participation in twentieth-century Anglican
        consecrations, and through the Polish National Catholic
        Church in the United States, several lines now cross between
        traditions in ways the older polemics did not anticipate.
        Protestant bodies that do not claim tactile succession —
        most Reformed and Baptist churches — locate apostolic
        continuity instead in fidelity to apostolic teaching, and
        treat the episcopal chain as inessential to the question.
      </P>

      <H2>What the doctrine is for</H2>

      <P>
        The practical consequence of apostolic succession, as the
        traditions that hold it describe it, is that the Christian
        who receives the eucharist at a parish today is eating the
        body of Christ consecrated by a man whose ordination runs
        through a concrete chain back to the hands of the Apostles.
        The succession is therefore not, in its primary function, a
        historical argument for the credibility of the Church; it is
        a mechanism by which the present moment is kept continuous
        with its source. The sacraments are the joints of the chain.
        Every valid ordination is a re-articulation of the first,
        and every valid eucharist is a re-enactment of a meal whose
        participants included, by sacramental reckoning, every
        eucharist that preceded it in the same line.
      </P>

      <H2>Audit lens</H2>

      <P>
        The textual record from Clement and Ignatius through Irenaeus
        is firm, early, and was not produced as polemic in defence of
        a contested doctrine; the episcopate is simply the structure
        the second-century Church already had. The points at which
        the readings diverge are points of interpretation laid on
        that record — the scope of Petrine primacy, the validity of
        particular post-Reformation ordinations, the weight of
        tactile succession against fidelity of teaching. Each of the
        three classical positions is internally coherent on its own
        premises, and the reader who wants to take the question
        seriously is asked to read each tradition in its own
        documents before deciding which account of the chain is the
        true one. The chain is checkable in the sense Irenaeus meant:
        the lists are public, the consecration records are public,
        the rites are published. The interpretation of what the chain
        carries is the part the reader is responsible for.
      </P>

      <P>
        The next lesson moves from the structure of the chain to one
        of the practices most closely woven into it. The{" "}
        <Em>rosary</Em> is the Marian prayer cycle in which the
        Catholic and much of the Anglican tradition rehearse the life
        of Christ through the eyes of his mother, bead by bead, in
        the same posture of received practice that the apostolic
        chain is meant to protect. From there the curriculum moves
        outward through the broader Christian lineage track —
        liturgy, monasticism, the councils — toward the eschatological
        horizon the whole tradition points at: the rescue protocol
        coming with Jesus Christ.
      </P>

      <H2>References</H2>

      <UList>
        <Li>
          <Em>First Epistle of Clement to the Corinthians</Em>{" "}
          (c. 96 AD), especially ch. 42–44.
        </Li>
        <Li>
          Ignatius of Antioch, <Em>Letters</Em> (c. 107 AD), especially
          to the Smyrnaeans, the Ephesians, and the Trallians.
        </Li>
        <Li>
          Irenaeus of Lyons,{" "}
          <Em>Against Heresies</Em> (c. 180 AD), Book III, esp. ch. 3.
        </Li>
        <Li>
          Cyprian of Carthage, <Em>De Unitate Ecclesiae</Em> (c. 251
          AD).
        </Li>
        <Li>
          Leo XIII (1896). <Em>Apostolicae Curae</Em> (on Anglican
          orders).
        </Li>
        <Li>
          Archbishops of Canterbury and York (1897). <Em>Saepius
          Officio</Em> (the Anglican response).
        </Li>
        <Li>
          Catechism of the Catholic Church, §861–862.
        </Li>
        <Li>
          Zizioulas, J. (1985).{" "}
          <Em>Being as Communion: Studies in Personhood and the Church</Em>.
          St Vladimir&apos;s. (Orthodox ecclesiology.)
        </Li>
      </UList>
    </>
  );
}
