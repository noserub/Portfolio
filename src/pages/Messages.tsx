import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  ArrowLeft, 
  Trash2, 
  Archive, 
  ArchiveRestore, 
  Forward, 
  CheckCircle, 
  Circle,
  Search,
  Filter,
  X,
  Send,
  Copy,
  Check,
  Clock,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { PageLayout } from '../components/layout/PageLayout';
import { useContactMessages, type ContactMessage } from '../hooks/useContactMessages';
import { Badge } from '../components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../components/ui/dropdown-menu';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface MessagesProps {
  onBack: () => void;
  isEditMode?: boolean;
}

type FilterType = 'all' | 'unread' | 'read' | 'archived';

export function Messages({ onBack, isEditMode = false }: MessagesProps) {
  const {
    messages,
    loading,
    error,
    fetchMessages,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteMessage,
    getUnreadCount,
    updateMessage,
  } = useContactMessages();

  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [forwardEmail, setForwardEmail] = useState('');
  const [forwardSubject, setForwardSubject] = useState('');
  const [forwardMessage, setForwardMessage] = useState('');
  const [forwardingIds, setForwardingIds] = useState<string[]>([]);
  const [isForwarding, setIsForwarding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messageViewRef = useRef<HTMLDivElement>(null);

  // Auto-mark as read when viewing a message
  useEffect(() => {
    if (selectedMessage && !selectedMessage.is_read) {
      markAsRead(selectedMessage.id);
    }
  }, [selectedMessage?.id]);

  // Filter and search messages
  const filteredMessages = messages.filter(msg => {
    // Filter by status
    if (filter === 'unread' && msg.is_read) return false;
    if (filter === 'read' && !msg.is_read) return false;
    if (filter === 'archived' && !msg.is_archived) return false;
    if (filter === 'all' && msg.is_archived) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        msg.name.toLowerCase().includes(query) ||
        msg.email.toLowerCase().includes(query) ||
        msg.message.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const unreadCount = getUnreadCount();
  const archivedCount = messages.filter(m => m.is_archived).length;

  // Handle message selection
  const handleSelectMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    setSelectedIds(new Set([message.id]));
  };

  // Handle bulk selection
  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredMessages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMessages.map(m => m.id)));
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      const success = await deleteMessage(id);
      if (success) {
        toast.success('Message deleted', {
          description: 'The message has been permanently deleted.',
        });
        if (selectedMessage?.id === id) {
          setSelectedMessage(null);
        }
      } else {
        toast.error('Failed to delete message');
      }
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.size} message(s)?`)) {
      const promises = Array.from(selectedIds).map(id => deleteMessage(id));
      await Promise.all(promises);
      setSelectedIds(new Set());
      toast.success('Messages deleted', {
        description: `${selectedIds.size} message(s) have been permanently deleted.`,
      });
    }
  };

  // Handle archive
  const handleArchive = async (id: string, archive: boolean) => {
    const success = await updateMessage(id, { is_archived: archive });
    if (success) {
      toast.success(archive ? 'Message archived' : 'Message restored', {
        description: archive 
          ? 'The message has been archived.' 
          : 'The message has been restored from archive.',
      });
    }
  };

  // Handle bulk archive
  const handleBulkArchive = async (archive: boolean) => {
    if (selectedIds.size === 0) return;
    const promises = Array.from(selectedIds).map(id => 
      updateMessage(id, { is_archived: archive })
    );
    await Promise.all(promises);
    setSelectedIds(new Set());
    toast.success(archive ? 'Messages archived' : 'Messages restored', {
      description: `${selectedIds.size} message(s) have been ${archive ? 'archived' : 'restored'}.`,
    });
  };

  // Handle forward
  const handleForwardClick = (ids: string[]) => {
    setForwardingIds(ids);
    const messagesToForward = messages.filter(m => ids.includes(m.id));
    const subject = messagesToForward.length === 1
      ? `Fwd: Contact Form Message from ${messagesToForward[0].name}`
      : `Fwd: ${messagesToForward.length} Contact Form Messages`;
    
    const messageBody = messagesToForward.map(msg => 
      `From: ${msg.name} <${msg.email}>\nDate: ${new Date(msg.created_at).toLocaleString()}\n\n${msg.message}`
    ).join('\n\n---\n\n');

    setForwardSubject(subject);
    setForwardMessage(messageBody);
    setShowForwardDialog(true);
  };

  const handleForwardSubmit = async () => {
    if (!forwardEmail || !forwardSubject || !forwardMessage) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsForwarding(true);
    try {
      // Create mailto link
      const mailtoLink = `mailto:${forwardEmail}?subject=${encodeURIComponent(forwardSubject)}&body=${encodeURIComponent(forwardMessage)}`;
      window.location.href = mailtoLink;
      
      toast.success('Forward initiated', {
        description: 'Your email client should open with the message ready to send.',
      });
      
      setShowForwardDialog(false);
      setForwardEmail('');
      setForwardSubject('');
      setForwardMessage('');
      setForwardingIds([]);
    } catch (error) {
      toast.error('Failed to open email client');
    } finally {
      setIsForwarding(false);
    }
  };

  // Copy message to clipboard
  const handleCopyMessage = async (message: ContactMessage) => {
    const text = `From: ${message.name} <${message.email}>\nDate: ${new Date(message.created_at).toLocaleString()}\n\n${message.message}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(message.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied', {
      description: 'Message copied to clipboard.',
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Mail className="w-8 h-8" />
                  Messages
                </h1>
                <p className="text-muted-foreground mt-1">
                  {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
                  {unreadCount > 0 && ` • ${unreadCount} unread`}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkArchive(true)}
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleForwardClick(Array.from(selectedIds))}
                  >
                    <Forward className="w-4 h-4 mr-2" />
                    Forward
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                >
                  Mark all as read
                </Button>
              )}
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  {filter === 'all' && 'All'}
                  {filter === 'unread' && 'Unread'}
                  {filter === 'read' && 'Read'}
                  {filter === 'archived' && 'Archived'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilter('all')}>
                  All ({messages.filter(m => !m.is_archived).length})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('unread')}>
                  Unread ({unreadCount})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('read')}>
                  Read ({messages.filter(m => m.is_read && !m.is_archived).length})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('archived')}>
                  Archived ({archivedCount})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading messages...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Message List */}
              <div className="lg:col-span-1 space-y-2">
                {filteredMessages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No messages found</p>
                  </div>
                ) : (
                  <>
                    {filteredMessages.length > 1 && (
                      <div className="flex items-center gap-2 p-2 border-b">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === filteredMessages.length}
                          onChange={handleSelectAll}
                          className="rounded"
                        />
                        <span className="text-sm text-muted-foreground">
                          Select all
                        </span>
                      </div>
                    )}
                    {filteredMessages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`
                          p-4 rounded-lg border cursor-pointer transition-all
                          ${selectedMessage?.id === message.id 
                            ? 'bg-primary/10 border-primary' 
                            : 'bg-card hover:bg-accent border-border'
                          }
                          ${!message.is_read ? 'font-semibold' : ''}
                        `}
                        onClick={() => handleSelectMessage(message)}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(message.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleSelect(message.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                {message.is_read ? (
                                  <CheckCircle className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <Circle className="w-4 h-4 text-primary" />
                                )}
                                <span className="font-medium truncate">
                                  {message.name}
                                </span>
                              </div>
                              {message.is_archived && (
                                <Badge variant="secondary" className="text-xs">
                                  Archived
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate mb-1">
                              {message.email}
                            </p>
                            <p className="text-sm line-clamp-2 text-foreground/80">
                              {message.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(message.created_at)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}
              </div>

              {/* Message Detail */}
              <div className="lg:col-span-2">
                {selectedMessage ? (
                  <motion.div
                    key={selectedMessage.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    ref={messageViewRef}
                    className="bg-card border border-border rounded-lg p-6"
                  >
                    {/* Message Header */}
                    <div className="flex items-start justify-between mb-6 pb-4 border-b">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h2 className="text-2xl font-bold">{selectedMessage.name}</h2>
                          {!selectedMessage.is_read && (
                            <Badge variant="default">New</Badge>
                          )}
                          {selectedMessage.is_archived && (
                            <Badge variant="secondary">Archived</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground mb-1">{selectedMessage.email}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(selectedMessage.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyMessage(selectedMessage)}
                          title="Copy message"
                        >
                          {copiedId === selectedMessage.id ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleForwardClick([selectedMessage.id])}
                          title="Forward message"
                        >
                          <Forward className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => selectedMessage.is_read 
                                ? markAsUnread(selectedMessage.id)
                                : markAsRead(selectedMessage.id)
                              }
                            >
                              {selectedMessage.is_read ? 'Mark as unread' : 'Mark as read'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleArchive(
                                selectedMessage.id,
                                !selectedMessage.is_archived
                              )}
                            >
                              {selectedMessage.is_archived ? (
                                <>
                                  <ArchiveRestore className="w-4 h-4 mr-2" />
                                  Restore from archive
                                </>
                              ) : (
                                <>
                                  <Archive className="w-4 h-4 mr-2" />
                                  Archive
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(selectedMessage.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Message Body */}
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap text-foreground">
                        {selectedMessage.message}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-card border border-border rounded-lg p-12 text-center">
                    <Mail className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Select a message to view</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Forward Dialog */}
        <AnimatePresence>
          {showForwardDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowForwardDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Forward className="w-6 h-6" />
                  Forward Message{forwardingIds.length > 1 ? 's' : ''}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      To Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="recipient@example.com"
                      value={forwardEmail}
                      onChange={(e) => setForwardEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Subject
                    </label>
                    <Input
                      value={forwardSubject}
                      onChange={(e) => setForwardSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Message
                    </label>
                    <Textarea
                      value={forwardMessage}
                      onChange={(e) => setForwardMessage(e.target.value)}
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForwardDialog(false);
                      setForwardEmail('');
                      setForwardSubject('');
                      setForwardMessage('');
                      setForwardingIds([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleForwardSubmit}
                    disabled={isForwarding || !forwardEmail || !forwardSubject}
                  >
                    {isForwarding ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Opening email...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Open Email Client
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageLayout>
  );
}

