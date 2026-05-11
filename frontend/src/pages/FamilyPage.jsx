import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiEye,
  FiFileText,
  FiHeart,
  FiLink,
  FiMail,
  FiPlus,
  FiShield,
  FiTrash2,
  FiUsers,
} from 'react-icons/fi';
import DashboardLayout from '../components/DashboardLayout';
import useAuthStore from '../stores/authStore';
import useFamilyStore from '../stores/familyStore';

const emptyMemberForm = {
  full_name: '',
  relation: '',
  birth_year: '',
  phone: '',
  emergency_contact: '',
  notes: '',
};

const emptyEntryForm = {
  entry_date: new Date().toISOString().slice(0, 10),
  category: 'note',
  title: '',
  severity: '',
  status: 'note',
  details: '',
};

const emptyInvitationForm = {
  invitee_email: '',
  relation: '',
  family_member_id: '',
  can_view_documents: true,
  can_add_records: false,
  can_edit_records: false,
  message: '',
};

const emptySharedRecordForm = {
  category: 'symptom',
  date: new Date().toISOString().slice(0, 10),
  title: '',
  severity: '',
  dosage: '',
  time_taken: '',
  hours_slept: '',
  quality: 'good',
  meal_type: 'snack',
  water_ml: '',
  notes: '',
};

const categories = [
  ['note', 'Not'],
  ['symptom', 'Semptom'],
  ['medication', 'İlaç'],
  ['sleep', 'Uyku'],
  ['nutrition', 'Beslenme'],
  ['appointment', 'Randevu'],
  ['document', 'Belge'],
];

const statuses = [
  ['note', 'Bilgi'],
  ['watching', 'Takipte'],
  ['improved', 'İyiye gidiyor'],
  ['needs_attention', 'Dikkat gerekli'],
  ['resolved', 'Çözüldü'],
];

function FamilyPage() {
  const { user } = useAuthStore();
  const [memberForm, setMemberForm] = useState(emptyMemberForm);
  const [entryForm, setEntryForm] = useState(emptyEntryForm);
  const [invitationForm, setInvitationForm] = useState(emptyInvitationForm);
  const [sharedRecordForm, setSharedRecordForm] = useState(emptySharedRecordForm);
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const {
    members,
    activeMember,
    entries,
    documents,
    availableDocuments,
    sentInvitations,
    receivedInvitations,
    sharedAccesses,
    sharedSummary,
    isLoading,
    error,
    fetchMembers,
    createMember,
    updateMember,
    deleteMember,
    openMember,
    fetchAvailableDocuments,
    fetchInvitations,
    sendInvitation,
    acceptInvitation,
    cancelInvitation,
    fetchSharedAccesses,
    openSharedAccess,
    createSharedRecord,
    updateSharedRecord,
    createEntry,
    deleteEntry,
    linkDocument,
    unlinkDocument,
  } = useFamilyStore();

  const isPremium = !!user?.is_premium;

  useEffect(() => {
    fetchInvitations().catch(() => {});
    if (!isPremium) return;
    fetchMembers().then((items) => {
      if (items?.[0]) openMember(items[0]).catch(() => {});
    }).catch(() => {});
    fetchAvailableDocuments().catch(() => {});
    fetchSharedAccesses().catch(() => {});
  }, [fetchAvailableDocuments, fetchInvitations, fetchMembers, fetchSharedAccesses, isPremium, openMember]);

  const activeAge = useMemo(() => {
    if (!activeMember?.birth_year) return null;
    return new Date().getFullYear() - Number(activeMember.birth_year);
  }, [activeMember]);

  const submitMember = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...memberForm,
        birth_year: memberForm.birth_year ? Number(memberForm.birth_year) : null,
      };
      await createMember(payload);
      setMemberForm(emptyMemberForm);
      toast.success('Aile üyesi eklendi.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const submitEntry = async (event) => {
    event.preventDefault();
    if (!activeMember) return;
    try {
      const payload = {
        ...entryForm,
        severity: entryForm.severity ? Number(entryForm.severity) : null,
      };
      await createEntry(activeMember.id, payload);
      setEntryForm(emptyEntryForm);
      toast.success('Takip kaydı eklendi.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateNotes = async () => {
    if (!activeMember) return;
    const notes = window.prompt('Aile üyesi notu', activeMember.notes || '');
    if (notes === null) return;
    try {
      await updateMember(activeMember.id, { notes });
      toast.success('Profil notu güncellendi.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteMember = async (member) => {
    if (!window.confirm(`${member.full_name} aile takip listesinden kaldırılsın mı?`)) return;
    try {
      await deleteMember(member.id);
      toast.success('Aile üyesi kaldırıldı.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleLinkDocument = async () => {
    if (!activeMember || !selectedDocumentId) return;
    try {
      await linkDocument(activeMember.id, selectedDocumentId);
      setSelectedDocumentId('');
      toast.success('Belge aile üyesine bağlandı.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const submitInvitation = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...invitationForm,
        family_member_id: invitationForm.family_member_id ? Number(invitationForm.family_member_id) : null,
      };
      await sendInvitation(payload);
      setInvitationForm(emptyInvitationForm);
      toast.success('Davet oluşturuldu.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAcceptInvitation = async (token) => {
    try {
      await acceptInvitation(token);
      toast.success('Davet kabul edildi.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const submitSharedRecord = async (event) => {
    event.preventDefault();
    if (!sharedSummary?.access) return;
    try {
      const payload = {
        ...sharedRecordForm,
        severity: sharedRecordForm.severity ? Number(sharedRecordForm.severity) : null,
        hours_slept: sharedRecordForm.hours_slept ? Number(sharedRecordForm.hours_slept) : null,
        water_ml: sharedRecordForm.water_ml ? Number(sharedRecordForm.water_ml) : null,
        time_taken: sharedRecordForm.time_taken || null,
      };
      await createSharedRecord(sharedSummary.access.id, payload);
      setSharedRecordForm(emptySharedRecordForm);
      toast.success('Gerçek kullanıcı kaydı eklendi.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateSharedRecord = async (category, item) => {
    if (!sharedSummary?.access) return;
    const currentTitle = item.symptom_name || item.name || item.notes || '';
    const title = window.prompt('Kayıt başlığı/notu', currentTitle);
    if (title === null) return;
    try {
      const payload = category === 'nutrition'
        ? { notes: title }
        : category === 'sleep'
          ? { notes: title }
          : { title, notes: item.notes };
      await updateSharedRecord(sharedSummary.access.id, category, item.id, payload);
      toast.success('Paylaşılan kayıt güncellendi.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <DashboardLayout>
      {!isPremium ? (
        <PremiumGate invitations={receivedInvitations} onAccept={handleAcceptInvitation} />
      ) : (
        <div className="grid xl:grid-cols-[340px_1fr] gap-6 max-w-[92rem] mx-auto">
          <aside className="space-y-5">
            <section className="glass-card rounded-2xl border border-navy-700/50 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 flex items-center justify-center">
                  <FiUsers size={22} />
                </div>
                <div>
                  <p className="text-teal-300 text-xs font-semibold">Premium</p>
                  <h1 className="text-white text-xl font-bold">Aile Takibi</h1>
                </div>
              </div>
              <p className="text-navy-400 text-sm">
                Yaşlı yakınların veya takip etmek istediğin aile üyeleri için ayrı sağlık notları ve belge bağlantıları tut.
              </p>
            </section>

            <section className="glass-card rounded-2xl border border-navy-700/50 p-4">
              <h2 className="text-white font-semibold mb-3">Aile Üyeleri</h2>
              <div className="space-y-2">
                {members.length === 0 && !isLoading && (
                  <div className="rounded-xl border border-dashed border-navy-700 p-4 text-sm text-navy-400 text-center">
                    Henüz aile üyesi yok.
                  </div>
                )}
                {members.map((member) => (
                  <div
                    key={member.id}
                    className={`rounded-xl border flex items-center gap-2 transition-colors ${
                      activeMember?.id === member.id
                        ? 'border-teal-500/40 bg-teal-500/10'
                        : 'border-navy-700/50 bg-navy-900/30 hover:bg-navy-800/60'
                    }`}
                  >
                    <button
                      onClick={() => openMember(member).catch((err) => toast.error(err.message))}
                      className="min-w-0 flex-1 text-left p-3"
                    >
                      <p className="text-white text-sm font-semibold truncate">{member.full_name}</p>
                      <p className="text-navy-400 text-xs mt-1">{member.relation}</p>
                      <p className="text-navy-500 text-xs mt-1">
                        {member.entry_count} kayıt · {member.document_count} belge
                      </p>
                    </button>
                    <button
                      onClick={() => handleDeleteMember(member)}
                      className="w-9 h-9 mr-2 rounded-lg text-navy-400 hover:text-red-300 hover:bg-red-500/10 flex items-center justify-center transition-colors"
                      title="Aile üyesini kaldır"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass-card rounded-2xl border border-navy-700/50 p-4">
              <h2 className="text-white font-semibold mb-3">Yeni Aile Üyesi</h2>
              <form onSubmit={submitMember} className="space-y-3">
                <input className={inputClass} placeholder="Ad Soyad" value={memberForm.full_name} onChange={(e) => setMemberForm({ ...memberForm, full_name: e.target.value })} required />
                <input className={inputClass} placeholder="Yakınlık (Anne, Baba vb.)" value={memberForm.relation} onChange={(e) => setMemberForm({ ...memberForm, relation: e.target.value })} required />
                <div className="grid grid-cols-2 gap-3">
                  <input className={inputClass} placeholder="Doğum yılı" type="number" value={memberForm.birth_year} onChange={(e) => setMemberForm({ ...memberForm, birth_year: e.target.value })} />
                  <input className={inputClass} placeholder="Telefon" value={memberForm.phone} onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })} />
                </div>
                <input className={inputClass} placeholder="Acil durumda aranacak kişi" value={memberForm.emergency_contact} onChange={(e) => setMemberForm({ ...memberForm, emergency_contact: e.target.value })} />
                <textarea className={`${inputClass} min-h-[86px]`} placeholder="Notlar" value={memberForm.notes} onChange={(e) => setMemberForm({ ...memberForm, notes: e.target.value })} />
                <button className="w-full rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 flex items-center justify-center gap-2 transition-colors">
                  <FiPlus /> Ekle
                </button>
              </form>
            </section>

            <section className="glass-card rounded-2xl border border-navy-700/50 p-4">
              <h2 className="text-white font-semibold mb-3">Davetle Bağla</h2>
              <form onSubmit={submitInvitation} className="space-y-3">
                <input className={inputClass} type="email" placeholder="Aile üyesinin e-postası" value={invitationForm.invitee_email} onChange={(e) => setInvitationForm({ ...invitationForm, invitee_email: e.target.value })} required />
                <input className={inputClass} placeholder="Yakınlık" value={invitationForm.relation} onChange={(e) => setInvitationForm({ ...invitationForm, relation: e.target.value })} required />
                <select className={inputClass} value={invitationForm.family_member_id} onChange={(e) => setInvitationForm({ ...invitationForm, family_member_id: e.target.value })}>
                  <option value="">Manuel profile bağlama</option>
                  {members.map((member) => <option key={member.id} value={member.id}>{member.full_name}</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm text-navy-200">
                  <input type="checkbox" checked={invitationForm.can_view_documents} onChange={(e) => setInvitationForm({ ...invitationForm, can_view_documents: e.target.checked })} />
                  Belgeleri görebilsin
                </label>
                <label className="flex items-center gap-2 text-sm text-navy-200">
                  <input type="checkbox" checked={invitationForm.can_add_records} onChange={(e) => setInvitationForm({ ...invitationForm, can_add_records: e.target.checked })} />
                  Kayıt ekleyebileyim
                </label>
                <label className="flex items-center gap-2 text-sm text-navy-200">
                  <input type="checkbox" checked={invitationForm.can_edit_records} onChange={(e) => setInvitationForm({ ...invitationForm, can_edit_records: e.target.checked })} />
                  Düzenleme izni
                </label>
                <textarea className={`${inputClass} min-h-[76px]`} placeholder="Davet notu" value={invitationForm.message} onChange={(e) => setInvitationForm({ ...invitationForm, message: e.target.value })} />
                <button className="w-full rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 flex items-center justify-center gap-2 transition-colors">
                  <FiMail /> Davet Oluştur
                </button>
              </form>
              {sentInvitations.length > 0 && (
                <div className="mt-4 space-y-2">
                  {sentInvitations.slice(0, 4).map((invitation) => (
                    <div key={invitation.id} className="rounded-xl bg-navy-900/40 border border-navy-700/50 p-3">
                      <p className="text-white text-sm truncate">{invitation.invitee_email}</p>
                      <p className="text-navy-400 text-xs mt-1">{invitation.status} · {invitation.relation}</p>
                      {invitation.status === 'pending' && (
                        <button onClick={() => cancelInvitation(invitation.id).catch((err) => toast.error(err.message))} className="text-red-300 text-xs mt-2 hover:text-red-200">
                          Daveti iptal et
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {receivedInvitations.length > 0 && (
              <section className="glass-card rounded-2xl border border-teal-500/30 p-4">
                <h2 className="text-white font-semibold mb-3">Gelen Davetler</h2>
                <div className="space-y-2">
                  {receivedInvitations.map((invitation) => (
                    <InvitationCard key={invitation.id} invitation={invitation} onAccept={() => handleAcceptInvitation(invitation.token)} />
                  ))}
                </div>
              </section>
            )}
          </aside>

          <main className="space-y-6 min-w-0">
            {error && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-red-200 text-sm flex gap-2">
                <FiAlertTriangle className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {!activeMember ? (
              <EmptyState />
            ) : (
              <>
                <section className="glass-card rounded-2xl border border-navy-700/50 p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <p className="text-teal-300 text-sm font-semibold">{activeMember.relation}</p>
                      <h2 className="text-white text-2xl font-bold">{activeMember.full_name}</h2>
                      <p className="text-navy-400 mt-2">
                        {activeAge ? `${activeAge} yaş` : 'Yaş bilgisi yok'} · {activeMember.phone || 'Telefon yok'}
                      </p>
                    </div>
                    <button
                      onClick={handleUpdateNotes}
                      className="rounded-xl bg-navy-800 hover:bg-navy-700 text-navy-100 px-4 py-2.5 text-sm font-semibold transition-colors"
                    >
                      Profil Notunu Düzenle
                    </button>
                  </div>
                  {(activeMember.emergency_contact || activeMember.notes) && (
                    <div className="grid md:grid-cols-2 gap-3 mt-5">
                      <InfoCard title="Acil İletişim" value={activeMember.emergency_contact || 'Belirtilmedi'} />
                      <InfoCard title="Notlar" value={activeMember.notes || 'Not yok'} />
                    </div>
                  )}
                </section>

                <section className="glass-card rounded-2xl border border-navy-700/50 p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-white font-semibold text-lg">Paylaşılan Gerçek Kullanıcılar</h2>
                      <p className="text-navy-400 text-sm">Davet kabul edildiğinde kişinin kendi TanıLog kayıtlarını izin kapsamında görebilirsin.</p>
                    </div>
                  </div>
                  {sharedAccesses.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-navy-700 p-6 text-center text-navy-400 text-sm">
                      Henüz kabul edilmiş aile daveti yok.
                    </div>
                  ) : (
                    <div className="grid lg:grid-cols-[280px_1fr] gap-4">
                      <div className="space-y-2">
                        {sharedAccesses.map((access) => (
                          <button
                            key={access.id}
                            onClick={() => openSharedAccess(access.id).catch((err) => toast.error(err.message))}
                            className={`w-full text-left rounded-xl border p-3 transition-colors ${
                              sharedSummary?.access?.id === access.id
                                ? 'border-teal-500/40 bg-teal-500/10'
                                : 'border-navy-700/50 bg-navy-900/30 hover:bg-navy-800/60'
                            }`}
                          >
                            <p className="text-white text-sm font-semibold truncate">{access.owner_name || access.owner_email}</p>
                            <p className="text-navy-400 text-xs mt-1">{access.relation}</p>
                            <p className="text-navy-500 text-xs mt-1">
                              {access.can_add_records ? 'Kayıt ekleme açık' : 'Sadece görüntüleme'}
                            </p>
                          </button>
                        ))}
                      </div>
                      <SharedSummaryPanel
                        summary={sharedSummary}
                        form={sharedRecordForm}
                        setForm={setSharedRecordForm}
                        onSubmit={submitSharedRecord}
                        onUpdateRecord={handleUpdateSharedRecord}
                      />
                    </div>
                  )}
                </section>

                <div className="grid 2xl:grid-cols-[1fr_420px] gap-6">
                  <section className="glass-card rounded-2xl border border-navy-700/50 p-5 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <h2 className="text-white font-semibold text-lg">Sağlık Takip Kayıtları</h2>
                      {isLoading && <span className="text-navy-500 text-xs">Yükleniyor...</span>}
                    </div>
                    {activeMember.linked_user_id ? (
                      <div className="rounded-xl border border-teal-500/20 bg-teal-500/10 p-4 mb-5 text-teal-100 text-sm">
                        Bu profil gerçek TanıLog hesabına bağlı. Kayıt ekleme veya düzeltme için aşağıdaki “Paylaşılan Gerçek Kullanıcılar” bölümündeki izinli aksiyonları kullan.
                      </div>
                    ) : (
                      <form onSubmit={submitEntry} className="grid md:grid-cols-2 gap-3 mb-5">
                        <input className={inputClass} type="date" value={entryForm.entry_date} onChange={(e) => setEntryForm({ ...entryForm, entry_date: e.target.value })} required />
                        <select className={inputClass} value={entryForm.category} onChange={(e) => setEntryForm({ ...entryForm, category: e.target.value })}>
                          {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                        <input className={`${inputClass} md:col-span-2`} placeholder="Başlık (örn: Tansiyon yükseldi)" value={entryForm.title} onChange={(e) => setEntryForm({ ...entryForm, title: e.target.value })} required />
                        <select className={inputClass} value={entryForm.status} onChange={(e) => setEntryForm({ ...entryForm, status: e.target.value })}>
                          {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                        <input className={inputClass} type="number" min="1" max="10" placeholder="Şiddet 1-10" value={entryForm.severity} onChange={(e) => setEntryForm({ ...entryForm, severity: e.target.value })} />
                        <textarea className={`${inputClass} md:col-span-2 min-h-[92px]`} placeholder="Detaylar, gözlem veya yapılacak takip..." value={entryForm.details} onChange={(e) => setEntryForm({ ...entryForm, details: e.target.value })} />
                        <button className="md:col-span-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 flex items-center justify-center gap-2 transition-colors">
                          <FiHeart /> Takip Kaydı Ekle
                        </button>
                      </form>
                    )}

                    <div className="space-y-3">
                      {entries.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-navy-700 p-8 text-center text-navy-400">
                          Bu aile üyesi için henüz takip kaydı yok.
                        </div>
                      ) : (
                        entries.map((entry) => (
                          <EntryCard
                            key={entry.id}
                            entry={entry}
                            onDelete={activeMember.linked_user_id ? null : () => deleteEntry(activeMember.id, entry.id).catch((err) => toast.error(err.message))}
                          />
                        ))
                      )}
                    </div>
                  </section>

                  <section className="glass-card rounded-2xl border border-navy-700/50 p-5">
                    <h2 className="text-white font-semibold text-lg mb-4">Bağlı Belgeler</h2>
                    {!activeMember.linked_user_id && (
                      <div className="flex gap-2 mb-4">
                        <select className={`${inputClass} min-w-0`} value={selectedDocumentId} onChange={(e) => setSelectedDocumentId(e.target.value)}>
                          <option value="">Belge seç</option>
                          {availableDocuments.map((document) => (
                            <option key={document.id} value={document.id}>{document.original_filename}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleLinkDocument}
                          disabled={!selectedDocumentId}
                          className="rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white px-4 flex items-center justify-center transition-colors"
                          title="Belge bağla"
                        >
                          <FiLink />
                        </button>
                      </div>
                    )}
                    <div className="space-y-3">
                      {documents.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-navy-700 p-6 text-center text-navy-400 text-sm">
                          Bağlı belge yok. Belgelerim ekranına yüklediğin bir dokümanı buraya bağlayabilirsin.
                        </div>
                      ) : (
                        documents.map((document) => (
                          <DocumentCard
                            key={document.id}
                            document={document}
                            onUnlink={activeMember.linked_user_id ? null : () => unlinkDocument(activeMember.id, document.id).catch((err) => toast.error(err.message))}
                          />
                        ))
                      )}
                    </div>
                  </section>
                </div>
              </>
            )}
          </main>
        </div>
      )}
    </DashboardLayout>
  );
}

function PremiumGate({ invitations = [], onAccept }) {
  return (
    <div className="min-h-[520px] flex items-center justify-center">
      <div className="glass-card rounded-2xl border border-navy-700/50 p-8 max-w-2xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-300 flex items-center justify-center mx-auto mb-4">
          <FiShield size={28} />
        </div>
        <h1 className="text-white text-2xl font-bold">Aile Takibi Premium</h1>
        <p className="text-navy-400 mt-3">
          Aile üyeleri için uzaktan sağlık takibi, belge bağlama ve düzenli kayıt görüntüleme Premium kullanıcılar için açılır.
        </p>
        <Link
          to="/billing"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-teal-500 hover:bg-teal-400 text-white px-5 py-3 text-sm font-bold transition-colors"
        >
          Premium'a Geç
        </Link>
        {invitations.length > 0 && (
          <div className="mt-6 text-left space-y-3">
            <h2 className="text-white font-semibold text-center">Sana gelen aile davetleri</h2>
            {invitations.map((invitation) => (
              <InvitationCard key={invitation.id} invitation={invitation} onAccept={() => onAccept(invitation.token)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InvitationCard({ invitation, onAccept }) {
  return (
    <div className="rounded-xl border border-teal-500/20 bg-teal-500/10 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold truncate">{invitation.inviter_name || 'TanıLog kullanıcısı'}</p>
          <p className="text-navy-300 text-xs mt-1">{invitation.relation} olarak takip daveti gönderdi.</p>
          {invitation.message && <p className="text-navy-300 text-xs mt-2">{invitation.message}</p>}
          <p className="text-navy-500 text-xs mt-2">
            {invitation.can_view_documents ? 'Belge erişimi açık' : 'Belge erişimi kapalı'} · {invitation.can_add_records ? 'Kayıt ekleyebilir' : 'Kayıt ekleyemez'}
          </p>
        </div>
        <button onClick={onAccept} className="rounded-xl bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 text-sm font-semibold transition-colors">
          Kabul Et
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass-card rounded-2xl border border-navy-700/50 p-10 text-center min-h-[420px] flex flex-col items-center justify-center">
      <FiUsers className="text-teal-300 mb-4" size={34} />
      <h2 className="text-white text-xl font-semibold">Takip etmek istediğin bir aile üyesi ekle.</h2>
      <p className="text-navy-400 mt-2 max-w-lg">
        Profil oluşturduktan sonra sağlık notları, randevu takibi ve belgeleri tek ekranda görebilirsin.
      </p>
    </div>
  );
}

function InfoCard({ title, value }) {
  return (
    <div className="rounded-xl border border-navy-700/50 bg-navy-900/30 p-4">
      <p className="text-navy-400 text-xs font-semibold mb-1">{title}</p>
      <p className="text-navy-100 text-sm whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function EntryCard({ entry, onDelete }) {
  const statusLabel = statuses.find(([value]) => value === entry.status)?.[1] || entry.status;
  const categoryLabel = categories.find(([value]) => value === entry.category)?.[1] || entry.category;
  return (
    <article className="rounded-xl border border-navy-700/50 bg-navy-900/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-200 px-2.5 py-1 text-xs">{categoryLabel}</span>
            <span className="rounded-full bg-navy-800 text-navy-300 px-2.5 py-1 text-xs">{statusLabel}</span>
            {entry.severity && <span className="rounded-full bg-red-500/10 text-red-200 px-2.5 py-1 text-xs">Şiddet {entry.severity}/10</span>}
          </div>
          <h3 className="text-white font-semibold">{entry.title}</h3>
          <p className="text-navy-500 text-xs mt-1">{new Date(entry.entry_date).toLocaleDateString('tr-TR')}</p>
        </div>
        {onDelete && (
          <button onClick={onDelete} className="w-9 h-9 rounded-lg text-navy-400 hover:text-red-300 hover:bg-red-500/10 flex items-center justify-center transition-colors">
            <FiTrash2 />
          </button>
        )}
      </div>
      {entry.details && <p className="text-navy-300 text-sm mt-3 whitespace-pre-wrap">{entry.details}</p>}
    </article>
  );
}

function DocumentCard({ document, onUnlink }) {
  return (
    <article className="rounded-xl border border-navy-700/50 bg-navy-900/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-teal-300 mb-2">
            <FiFileText />
            <span className="text-xs font-semibold">{document.category}</span>
          </div>
          <h3 className="text-white font-semibold truncate">{document.original_filename}</h3>
          <p className="text-navy-500 text-xs mt-1">{new Date(document.created_at).toLocaleDateString('tr-TR')}</p>
        </div>
        {onUnlink && (
          <button onClick={onUnlink} className="w-9 h-9 rounded-lg text-navy-400 hover:text-red-300 hover:bg-red-500/10 flex items-center justify-center transition-colors">
            <FiTrash2 />
          </button>
        )}
      </div>
      {document.analysis?.summary && (
        <div className="mt-3 rounded-lg bg-teal-500/10 border border-teal-500/20 p-3">
          <p className="text-teal-100 text-sm">{document.analysis.summary}</p>
        </div>
      )}
    </article>
  );
}

function SharedSummaryPanel({ summary, form, setForm, onSubmit, onUpdateRecord }) {
  if (!summary) {
    return (
      <div className="rounded-xl border border-dashed border-navy-700 p-6 text-center text-navy-400 text-sm">
        Paylaşımlı kullanıcının kayıtlarını görmek için soldan bir kişi seç.
      </div>
    );
  }

  const access = summary.access;
  const health = summary.health || {};
  const totalRecords = (health.symptoms?.length || 0) + (health.medications?.length || 0) + (health.sleep?.length || 0) + (health.nutrition?.length || 0);

  return (
    <div className="space-y-4 min-w-0">
      <div className="rounded-xl border border-navy-700/50 bg-navy-900/30 p-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <p className="text-teal-300 text-xs font-semibold">Gerçek TanıLog Kaydı</p>
            <h3 className="text-white font-semibold text-lg">{access.owner_name || access.owner_email}</h3>
            <p className="text-navy-400 text-sm">{totalRecords} kayıt · {summary.documents?.length || 0} belge</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-navy-800 text-navy-200 px-3 py-1 text-xs inline-flex items-center gap-1"><FiEye /> Görüntüleme</span>
            {access.can_add_records && <span className="rounded-full bg-teal-500/10 text-teal-200 border border-teal-500/20 px-3 py-1 text-xs inline-flex items-center gap-1"><FiPlus /> Kayıt ekleme</span>}
            {access.can_edit_records && <span className="rounded-full bg-blue-500/10 text-blue-200 border border-blue-500/20 px-3 py-1 text-xs inline-flex items-center gap-1"><FiCheckCircle /> Düzenleme</span>}
          </div>
        </div>
      </div>

      {access.can_add_records && (
        <form onSubmit={onSubmit} className="rounded-xl border border-navy-700/50 bg-navy-900/30 p-4 grid md:grid-cols-2 gap-3">
          <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="symptom">Semptom</option>
            <option value="medication">İlaç</option>
            <option value="sleep">Uyku</option>
            <option value="nutrition">Beslenme</option>
          </select>
          <input className={inputClass} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <input className={`${inputClass} md:col-span-2`} placeholder="Başlık / kayıt adı" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          {form.category === 'symptom' && <input className={inputClass} type="number" min="1" max="10" placeholder="Şiddet 1-10" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} />}
          {form.category === 'medication' && <input className={inputClass} placeholder="Dozaj" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} />}
          {form.category === 'medication' && <input className={inputClass} type="time" value={form.time_taken} onChange={(e) => setForm({ ...form, time_taken: e.target.value })} />}
          {form.category === 'sleep' && <input className={inputClass} type="number" step="0.5" min="0" max="24" placeholder="Uyku saati" value={form.hours_slept} onChange={(e) => setForm({ ...form, hours_slept: e.target.value })} />}
          {form.category === 'nutrition' && <input className={inputClass} type="number" min="0" placeholder="Su ml" value={form.water_ml} onChange={(e) => setForm({ ...form, water_ml: e.target.value })} />}
          <textarea className={`${inputClass} md:col-span-2 min-h-[84px]`} placeholder="Not" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button className="md:col-span-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 transition-colors">Gerçek Kayda Ekle</button>
        </form>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        <SharedList title="Semptomlar" category="symptom" canEdit={access.can_edit_records} items={health.symptoms || []} getTitle={(item) => item.symptom_name} onUpdate={onUpdateRecord} />
        <SharedList title="İlaçlar" category="medication" canEdit={access.can_edit_records} items={health.medications || []} getTitle={(item) => item.name} onUpdate={onUpdateRecord} />
        <SharedList title="Uyku" category="sleep" canEdit={access.can_edit_records} items={health.sleep || []} getTitle={(item) => `${item.hours_slept} saat · ${item.quality}`} onUpdate={onUpdateRecord} />
        <SharedList title="Beslenme" category="nutrition" canEdit={access.can_edit_records} items={health.nutrition || []} getTitle={(item) => item.notes} onUpdate={onUpdateRecord} />
      </div>

      {summary.documents?.length > 0 && (
        <div className="rounded-xl border border-navy-700/50 bg-navy-900/30 p-4">
          <h4 className="text-white font-semibold mb-3">Paylaşılan Belgeler</h4>
          <div className="space-y-2">
            {summary.documents.map((document) => (
              <div key={document.id} className="rounded-lg bg-navy-800/60 p-3">
                <p className="text-white text-sm font-semibold truncate">{document.original_filename}</p>
                {document.analysis?.summary && <p className="text-navy-300 text-xs mt-1">{document.analysis.summary}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SharedList({ title, category, items, getTitle, canEdit, onUpdate }) {
  return (
    <div className="rounded-xl border border-navy-700/50 bg-navy-900/30 p-4 min-w-0">
      <h4 className="text-white font-semibold mb-3">{title}</h4>
      {items.length === 0 ? (
        <p className="text-navy-500 text-sm">Kayıt yok.</p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 5).map((item) => (
            <div key={item.id} className="rounded-lg bg-navy-800/60 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-navy-100 text-sm truncate">{getTitle(item)}</p>
                  <p className="text-navy-500 text-xs mt-1">{new Date(item.date).toLocaleDateString('tr-TR')}</p>
                </div>
                {canEdit && (
                  <button onClick={() => onUpdate(category, item)} className="text-teal-300 hover:text-teal-200 text-xs font-semibold">
                    Düzelt
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputClass = 'w-full bg-navy-900/60 border border-navy-700 rounded-xl px-3 py-3 text-white placeholder-navy-500 focus:outline-none focus:border-teal-500 transition-colors';

export default FamilyPage;
