import { auth, db } from '@/firebase/firebaseConfig';
import { Incident } from '@/types/incident';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { getTimeAgo } from '@/lib/date';

interface Comment {
  id: string;
  comment: string;
  user_id: string;
  user_name: string;
  created_at: any;
}

interface CommentsProps {
  incident: Incident;
}

export function Comments({ incident }: CommentsProps) {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // Subscreve aos comentários em tempo real
  useEffect(() => {
    if (!incident?.id) return;

    const commentsRef = collection(db, 'incidents', incident.id, 'comments');
    const q = query(commentsRef, orderBy('created_at', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedComments: Comment[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetchedComments.push({
            id: doc.id,
            comment: data.comment,
            user_id: data.user_id,
            user_name: data.user_name,
            created_at: data.created_at,
          });
        });
        setComments(fetchedComments);
      },
      (error) => {
        console.error('[Comments] Erro ao buscar comentários:', error);
      }
    );

    return () => unsubscribe();
  }, [incident?.id]);

  const handleSendComment = async () => {
    if (!comment.trim() || !auth.currentUser) {
      Alert.alert('Erro', 'Por favor, escreva um comentário');
      return;
    }

    setIsSending(true);
    try {
      const commentsRef = collection(db, 'incidents', incident.id, 'comments');

      await addDoc(commentsRef, {
        comment: comment.trim(),
        user_id: auth.currentUser.uid,
        user_name: auth.currentUser.displayName || auth.currentUser.email || 'Usuário anônimo',
        created_at: serverTimestamp(),
      });

      setComment('');
    } catch (error: any) {
      console.error('[Comments] Erro ao enviar comentário:', error);
      Alert.alert('Erro', error.message || 'Não foi possível enviar o comentário');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    Alert.alert('Deletar Comentário', 'Tem certeza que deseja deletar este comentário?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Deletar',
        style: 'destructive',
        onPress: async () => {
          try {
            const commentRef = doc(db, 'incidents', incident.id, 'comments', commentId);
            await deleteDoc(commentRef);
            Alert.alert('Sucesso', 'Comentário deletado com sucesso!');
          } catch (error: any) {
            console.error('[Comments] Erro ao deletar comentário:', error);
            Alert.alert('Erro', error.message || 'Não foi possível deletar o comentário');
          }
        },
      },
    ]);
  };

  const handleEditComment = (commentId: string, currentText: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentText);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editingCommentText.trim()) {
      Alert.alert('Erro', 'O comentário não pode estar vazio');
      return;
    }

    try {
      const commentRef = doc(db, 'incidents', incident.id, 'comments', commentId);
      await updateDoc(commentRef, {
        comment: editingCommentText.trim(),
      });

      setEditingCommentId(null);
      setEditingCommentText('');
      Alert.alert('Sucesso', 'Comentário atualizado com sucesso!');
    } catch (error: any) {
      console.error('[Comments] Erro ao editar comentário:', error);
      Alert.alert('Erro', error.message || 'Não foi possível editar o comentário');
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  return (
    <View className="flex-1">
      {/* Header com contador */}
      <View className="mb-3 flex flex-row items-center gap-2">
        <Text className="text-base font-semibold text-neutral-900">Comentários</Text>
        <View className="h-5 w-5 items-center justify-center rounded-full bg-neutral-200">
          <Text className="text-xs font-bold text-neutral-700">{comments.length}</Text>
        </View>
      </View>

      {/* Lista de comentários */}
      {comments.length > 0 ? (
        <ScrollView className="mb-3 max-h-96" showsVerticalScrollIndicator={true}>
          <View className="gap-2">
            {comments.map((commentItem) => {
              const createdAt =
                commentItem.created_at && typeof commentItem.created_at === 'object' && 'seconds' in commentItem.created_at
                  ? new Date(commentItem.created_at.seconds * 1000)
                  : new Date();
              const timeAgo = getTimeAgo(createdAt);
              const isAuthor = auth.currentUser?.uid === commentItem.user_id;
              const isEditing = editingCommentId === commentItem.id;

              return (
                <View key={commentItem.id} className="rounded-lg bg-neutral-50 p-3">
                  <View className="mb-2 flex flex-row items-center justify-between">
                    <Text className="text-sm font-semibold text-neutral-900">
                      {commentItem.user_name}
                    </Text>
                    <View className="flex flex-row items-center gap-2">
                      <Text className="text-xs text-neutral-500">{timeAgo}</Text>
                      {isAuthor && !isEditing && (
                        <>
                          <Pressable
                            onPress={() => handleEditComment(commentItem.id, commentItem.comment)}
                            className="h-6 w-6 items-center justify-center">
                            <Ionicons name="create-outline" size={16} color="#6366f1" />
                          </Pressable>
                          <Pressable
                            onPress={() => handleDeleteComment(commentItem.id)}
                            className="h-6 w-6 items-center justify-center">
                            <Ionicons name="trash-outline" size={16} color="#ef4444" />
                          </Pressable>
                        </>
                      )}
                    </View>
                  </View>

                  {isEditing ? (
                    <View className="gap-2">
                      <TextInput
                        value={editingCommentText}
                        onChangeText={setEditingCommentText}
                        className="rounded-lg border border-primary bg-white px-3 py-2 text-sm text-neutral-900"
                        multiline
                        maxLength={500}
                        autoFocus
                      />
                      <View className="flex flex-row gap-2">
                        <Pressable
                          onPress={handleCancelEdit}
                          className="flex-1 items-center justify-center rounded-lg border border-neutral-300 bg-white py-2">
                          <Text className="text-sm font-medium text-neutral-700">Cancelar</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleSaveEdit(commentItem.id)}
                          className="flex-1 items-center justify-center rounded-lg bg-primary py-2">
                          <Text className="text-sm font-medium text-white">Salvar</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Text className="text-sm text-neutral-700">{commentItem.comment}</Text>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        <View className="mb-3 rounded-lg bg-neutral-50 p-4">
          <Text className="text-center text-sm text-neutral-500">
            Nenhum comentário ainda. Seja o primeiro!
          </Text>
        </View>
      )}

      {/* Campo de comentário */}
      <View className="flex flex-row gap-2">
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Escreva um comentário..."
          className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900"
          multiline
          maxLength={500}
          editable={!isSending}
        />
        <Pressable
          onPress={handleSendComment}
          disabled={isSending || !comment.trim()}
          className={`h-12 w-12 items-center justify-center rounded-lg ${
            isSending || !comment.trim() ? 'bg-neutral-300' : 'bg-primary'
          }`}>
          <Ionicons name="send" size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
