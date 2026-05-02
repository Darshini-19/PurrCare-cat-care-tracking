export default function FoodGuide() {
  return (
    <div className="page">
      <div
  style={{
    background: "rgba(247, 244, 255, 0.82)",
    border: "1px solid #8f79c9",
    borderRadius: "18px",
    padding: "1.1rem 1.25rem",
    marginBottom: "1.25rem",
    boxShadow: "0 8px 18px rgba(60, 34, 112, 0.08)",
    maxWidth: "580px",
    marginInline: "auto",
    
  }}
>
  <h1 style={{textAlign: "center"}}>Food &amp; care guide</h1>
  <p style={{ marginBottom: 0, textAlign: "center" }}>
    General education for cat owners — not a prescription for your pet. Always confirm diet
    changes with your veterinarian, especially for kittens, or cats with conditions.
  </p>
</div>

      <div
  className="card"
  style={{
    background: "rgba(247, 244, 255, 0.96)",
    border: "1px solid #8f79c9",
    boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
    
  }}
>
        <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontSize: "1.2rem" }}>
          Usually appropriate foods
        </h2>
        <ul>
          <li>
            <strong>Complete commercial cat food</strong> (wet, dry, or mixed) formulated for the
            cat’s life stage.
          </li>
          <li>
            <strong>Plain cooked proteins</strong> occasionally as a topper if your vet agrees —
            e.g. unseasoned chicken or turkey, no onion/garlic.
          </li>
          <li>
            <strong>Fresh water</strong> always available; some cats prefer wide bowls or fountains.
          </li>
        </ul>
      </div>

      <div
  className="card"
  style={{
    background: "rgba(247, 244, 255, 0.96)",
    border: "1px solid #8f79c9",
    boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
  }}
>
        <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontSize: "1.2rem" }}>
          Foods to avoid or treat with caution
        </h2>
        <ul>
          <li>
            <strong>Onion, garlic, chives</strong> — can damage red blood cells.
          </li>
          <li>
            <strong>Chocolate, caffeine, alcohol</strong> — toxic.
          </li>
          <li>
            <strong>Grapes and raisins</strong> — avoid; risk of kidney injury.
          </li>
          <li>
            <strong>Cooked bones</strong> — splinter risk; raw diet debates belong with your vet.
          </li>
          <li>
            <strong>Large amounts of dairy</strong> — many cats are lactose intolerant.
          </li>
          <li>
            <strong>Dog food</strong> — not balanced for cats long term (taurine, vitamin A, etc.).
          </li>
        </ul>
      </div>

      <div
  className="card"
  style={{
    background: "rgba(247, 244, 255, 0.96)",
    border: "1px solid #8f79c9",
    boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
  }}
>
        <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontSize: "1.2rem" }}>
          Behavior &amp; habits (basics)
        </h2>
        <ul>
          <li>
            <strong>Sleep</strong> — cats sleep often; sudden lethargy with other symptoms warrants
            a vet call.
          </li>
          <li>
            <strong>Scratching</strong> — normal marking/stretching; provide sturdy posts and trim
            nails regularly.
          </li>
          <li>
            <strong>Hiding</strong> — common with stress or illness; note appetite and litter use.
          </li>
          <li>
            <strong>Play</strong> — daily interactive play reduces boredom and supports healthy weight.
          </li>
        </ul>
      </div>

      <div
  className="alert"
  style={{
    marginTop: "1rem",
    background: "#ece4ff",
    border: "1px solid #8f79c9",
    color: "#24143f",
    boxShadow: "0 8px 18px rgba(60, 34, 112, 0.08)",
  }}
>
        PurrCare is a tracking tool. For diagnosis or treatment decisions, rely on a licensed
        veterinarian who knows your cat.
      </div>
    </div>
  );
}
