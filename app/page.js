
import Link from "next/link";

export default function Home() {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh"}}>
      <h1>LandingRodi AI 🚀</h1>
      <Link href="/workspace">Start Building</Link>
    </div>
  );
}
