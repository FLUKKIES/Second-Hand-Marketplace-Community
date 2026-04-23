import { ModalContent } from "./ModalContent";

export default async function PostModal({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <ModalContent postId={id} />;
}
