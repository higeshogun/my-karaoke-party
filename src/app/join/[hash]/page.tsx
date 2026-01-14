import JoinScene from "../join-scene";

export default async function JoinPartyHashPage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash: partyHash } = await params;

  return <JoinScene partyHash={partyHash} />;
}
