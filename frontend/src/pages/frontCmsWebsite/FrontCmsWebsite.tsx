import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { frontCmsWebsiteService, WebsiteSettings, Banner, BannerFormData } from '../../services/api/frontCmsWebsiteService';
import { aboutUsPageService, MissionVision, Counter, History, CoreValue, Achievement, Leader } from '../../services/api/aboutUsPageService';
import { admissionManagementService, ImportantDate, ContactDetails } from '../../services/api/admissionManagementService';
import { galleryManagementService, GalleryCategory, GalleryImage } from '../../services/api/galleryManagementService';
import { newsEventsManagementService, NewsArticle, Event } from '../../services/api/newsEventsManagementService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import './FrontCmsWebsite.css';
import '../aboutUsPage/AboutUsPage.css';

const FrontCmsWebsite: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'header' | 'banners' | 'about-us' | 'admission' | 'gallery' | 'news' | 'events'>('header');
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Fetch website settings
  const { data: settings, isLoading: settingsLoading } = useQuery<WebsiteSettings>(
    'front-cms-website-settings',
    () => frontCmsWebsiteService.getWebsiteSettings(),
    { refetchOnWindowFocus: false }
  );

  // Fetch banners
  const { data: banners = [], isLoading: bannersLoading } = useQuery<Banner[]>(
    'front-cms-website-banners',
    () => frontCmsWebsiteService.getBanners(),
    { refetchOnWindowFocus: false }
  );

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<Partial<WebsiteSettings>>({});

  React.useEffect(() => {
    if (settings) {
      setSettingsForm(settings);
      if (settings.website_logo) {
        const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
        setLogoPreview(`${apiBase}${settings.website_logo}`);
      }
    }
  }, [settings]);

  // Update settings mutation
  const updateSettingsMutation = useMutation(
    ({ data, logoFile }: { data: Partial<WebsiteSettings>; logoFile?: File | null }) =>
      frontCmsWebsiteService.updateWebsiteSettings(data, logoFile || undefined),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('front-cms-website-settings');
        showToast('Website settings updated successfully', 'success');
        setLogoFile(null);
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update settings', 'error');
      },
    }
  );

  // Banner mutations
  const createBannerMutation = useMutation(
    (data: BannerFormData) => frontCmsWebsiteService.createBanner(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('front-cms-website-banners');
        showToast('Banner created successfully', 'success');
        setShowBannerModal(false);
        resetBannerForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to create banner', 'error');
      },
    }
  );

  const updateBannerMutation = useMutation(
    ({ id, data }: { id: number; data: BannerFormData }) =>
      frontCmsWebsiteService.updateBanner(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('front-cms-website-banners');
        showToast('Banner updated successfully', 'success');
        setShowBannerModal(false);
        resetBannerForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update banner', 'error');
      },
    }
  );

  const deleteBannerMutation = useMutation(
    (id: number) => frontCmsWebsiteService.deleteBanner(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('front-cms-website-banners');
        showToast('Banner deleted successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to delete banner', 'error');
      },
    }
  );

  const [bannerForm, setBannerForm] = useState<BannerFormData>({
    title: '',
    description: '',
    button_text: '',
    button_url: '',
    sort_order: 0,
    is_active: true,
  });

  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);

  const resetBannerForm = () => {
    setBannerForm({
      title: '',
      description: '',
      button_text: '',
      button_url: '',
      sort_order: banners.length,
      is_active: true,
    });
    setBannerImagePreview(null);
    setBannerImageFile(null);
    setEditingBanner(null);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate({ data: settingsForm, logoFile });
  };

  const handleBannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title) {
      showToast('Title is required', 'error');
      return;
    }
    if (!editingBanner && !bannerImageFile) {
      showToast('Banner image is required', 'error');
      return;
    }

    const formData: BannerFormData = {
      ...bannerForm,
      banner_image: bannerImageFile || undefined,
    };

    if (editingBanner) {
      updateBannerMutation.mutate({ id: editingBanner.id!, data: formData });
    } else {
      createBannerMutation.mutate(formData);
    }
  };

  const handleEditBanner = (banner: Banner) => {
    setEditingBanner(banner);
    setBannerForm({
      title: banner.title,
      description: banner.description || '',
      button_text: banner.button_text || '',
      button_url: banner.button_url || '',
      sort_order: banner.sort_order,
      is_active: banner.is_active,
    });
    if (banner.image_path) {
      const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
      setBannerImagePreview(`${apiBase}${banner.image_path}`);
    }
    setShowBannerModal(true);
  };

  const handleDeleteBanner = (id: number) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      deleteBannerMutation.mutate(id);
    }
  };

  // About Us Page State and Logic
  const [aboutUsSubTab, setAboutUsSubTab] = useState<'mission-vision' | 'counters' | 'history' | 'values' | 'achievements' | 'leadership'>('mission-vision');
  
  // Mission & Vision
  const { data: missionVision, isLoading: mvLoading } = useQuery('about-us-mission-vision', aboutUsPageService.getMissionVision);
  const [mvForm, setMvForm] = useState({ mission_content: '', vision_content: '' });

  useEffect(() => {
    if (missionVision) {
      setMvForm({
        mission_content: missionVision.mission_content || '',
        vision_content: missionVision.vision_content || '',
      });
    }
  }, [missionVision]);

  const updateMvMutation = useMutation(aboutUsPageService.updateMissionVision, {
    onSuccess: () => {
      queryClient.invalidateQueries('about-us-mission-vision');
      showToast('Mission & Vision updated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update Mission & Vision', 'error');
    },
  });

  // Counters
  const { data: counters = [], isLoading: countersLoading } = useQuery('about-us-counters', aboutUsPageService.getCounters);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [editingCounter, setEditingCounter] = useState<Counter | null>(null);
  const [counterForm, setCounterForm] = useState({ counter_number: '', counter_label: '', sort_order: 0, is_active: true });

  const createCounterMutation = useMutation(aboutUsPageService.createCounter, {
    onSuccess: () => {
      queryClient.invalidateQueries('about-us-counters');
      showToast('Counter created successfully', 'success');
      setShowCounterModal(false);
      resetCounterForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create counter', 'error');
    },
  });

  const updateCounterMutation = useMutation(({ id, data }: { id: number; data: Partial<Counter> }) => aboutUsPageService.updateCounter(id, data), {
    onSuccess: () => {
      queryClient.invalidateQueries('about-us-counters');
      showToast('Counter updated successfully', 'success');
      setShowCounterModal(false);
      resetCounterForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update counter', 'error');
    },
  });

  const deleteCounterMutation = useMutation(aboutUsPageService.deleteCounter, {
    onSuccess: () => {
      queryClient.invalidateQueries('about-us-counters');
      showToast('Counter deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete counter', 'error');
    },
  });

  const resetCounterForm = () => {
    setCounterForm({ counter_number: '', counter_label: '', sort_order: 0, is_active: true });
    setEditingCounter(null);
  };

  const handleEditCounter = (counter: Counter) => {
    setEditingCounter(counter);
    setCounterForm({
      counter_number: counter.counter_number,
      counter_label: counter.counter_label,
      sort_order: counter.sort_order,
      is_active: counter.is_active,
    });
    setShowCounterModal(true);
  };

  // History
  const { data: history, isLoading: historyLoading } = useQuery('about-us-history', aboutUsPageService.getHistory);
  const [historyForm, setHistoryForm] = useState({ history_content: '' });
  const [historyImageFile, setHistoryImageFile] = useState<File | null>(null);
  const [historyImagePreview, setHistoryImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (history) {
      setHistoryForm({ history_content: history.history_content || '' });
      if (history.history_image) {
        const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
        setHistoryImagePreview(`${apiBase}${history.history_image}`);
      }
    }
  }, [history]);

  const updateHistoryMutation = useMutation(
    ({ data, imageFile }: { data: { history_content: string; history_image?: string | null }; imageFile?: File | null }) =>
      aboutUsPageService.updateHistory(data, imageFile || undefined),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('about-us-history');
        showToast('History updated successfully', 'success');
        setHistoryImageFile(null);
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update history', 'error');
      },
    }
  );

  // Core Values
  const { data: values = [], isLoading: valuesLoading } = useQuery('about-us-values', aboutUsPageService.getValues);
  const [showValueModal, setShowValueModal] = useState(false);
  const [editingValue, setEditingValue] = useState<CoreValue | null>(null);
  const [valueForm, setValueForm] = useState({ icon_class: 'fas fa-star', title: '', description: '', sort_order: 0, is_active: true });

  const createValueMutation = useMutation(aboutUsPageService.createValue, {
    onSuccess: () => {
      queryClient.invalidateQueries('about-us-values');
      showToast('Core Value created successfully', 'success');
      setShowValueModal(false);
      resetValueForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create core value', 'error');
    },
  });

  const updateValueMutation = useMutation(({ id, data }: { id: number; data: Partial<CoreValue> }) => aboutUsPageService.updateValue(id, data), {
    onSuccess: () => {
      queryClient.invalidateQueries('about-us-values');
      showToast('Core Value updated successfully', 'success');
      setShowValueModal(false);
      resetValueForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update core value', 'error');
    },
  });

  const deleteValueMutation = useMutation(aboutUsPageService.deleteValue, {
    onSuccess: () => {
      queryClient.invalidateQueries('about-us-values');
      showToast('Core Value deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete core value', 'error');
    },
  });

  const resetValueForm = () => {
    setValueForm({ icon_class: 'fas fa-star', title: '', description: '', sort_order: 0, is_active: true });
    setEditingValue(null);
  };

  const handleEditValue = (value: CoreValue) => {
    setEditingValue(value);
    setValueForm({
      icon_class: value.icon_class,
      title: value.title,
      description: value.description,
      sort_order: value.sort_order,
      is_active: value.is_active,
    });
    setShowValueModal(true);
  };

  // Achievements
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery('about-us-achievements', aboutUsPageService.getAchievements);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [achievementForm, setAchievementForm] = useState({ achievement_year: '', achievement_title: '', achievement_description: '', sort_order: 0, is_active: true });

  const createAchievementMutation = useMutation(aboutUsPageService.createAchievement, {
    onSuccess: () => {
      queryClient.invalidateQueries('about-us-achievements');
      showToast('Achievement created successfully', 'success');
      setShowAchievementModal(false);
      resetAchievementForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create achievement', 'error');
    },
  });

  const updateAchievementMutation = useMutation(({ id, data }: { id: number; data: Partial<Achievement> }) => aboutUsPageService.updateAchievement(id, data), {
    onSuccess: () => {
      queryClient.invalidateQueries('about-us-achievements');
      showToast('Achievement updated successfully', 'success');
      setShowAchievementModal(false);
      resetAchievementForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update achievement', 'error');
    },
  });

  const deleteAchievementMutation = useMutation(aboutUsPageService.deleteAchievement, {
    onSuccess: () => {
      queryClient.invalidateQueries('about-us-achievements');
      showToast('Achievement deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete achievement', 'error');
    },
  });

  const resetAchievementForm = () => {
    setAchievementForm({ achievement_year: '', achievement_title: '', achievement_description: '', sort_order: 0, is_active: true });
    setEditingAchievement(null);
  };

  const handleEditAchievement = (achievement: Achievement) => {
    setEditingAchievement(achievement);
    setAchievementForm({
      achievement_year: achievement.achievement_year,
      achievement_title: achievement.achievement_title,
      achievement_description: achievement.achievement_description,
      sort_order: achievement.sort_order,
      is_active: achievement.is_active,
    });
    setShowAchievementModal(true);
  };

  // Leadership
  const { data: leadership = [], isLoading: leadershipLoading } = useQuery('about-us-leadership', aboutUsPageService.getLeadership);
  const [showLeaderModal, setShowLeaderModal] = useState(false);
  const [editingLeader, setEditingLeader] = useState<Leader | null>(null);
  const [leaderForm, setLeaderForm] = useState({ leader_name: '', leader_role: '', leader_bio: '', sort_order: 0, is_active: true });
  const [leaderImageFile, setLeaderImageFile] = useState<File | null>(null);
  const [leaderImagePreview, setLeaderImagePreview] = useState<string | null>(null);

  const createLeaderMutation = useMutation(
    ({ data, imageFile }: { data: Partial<Leader>; imageFile?: File | null }) => aboutUsPageService.createLeader(data, imageFile || undefined),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('about-us-leadership');
        showToast('Leader created successfully', 'success');
        setShowLeaderModal(false);
        resetLeaderForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to create leader', 'error');
      },
    }
  );

  const updateLeaderMutation = useMutation(
    ({ id, data, imageFile }: { id: number; data: Partial<Leader>; imageFile?: File | null }) =>
      aboutUsPageService.updateLeader(id, data, imageFile || undefined),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('about-us-leadership');
        showToast('Leader updated successfully', 'success');
        setShowLeaderModal(false);
        resetLeaderForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update leader', 'error');
      },
    }
  );

  const deleteLeaderMutation = useMutation(aboutUsPageService.deleteLeader, {
    onSuccess: () => {
      queryClient.invalidateQueries('about-us-leadership');
      showToast('Leader deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete leader', 'error');
    },
  });

  const resetLeaderForm = () => {
    setLeaderForm({ leader_name: '', leader_role: '', leader_bio: '', sort_order: 0, is_active: true });
    setLeaderImageFile(null);
    setLeaderImagePreview(null);
    setEditingLeader(null);
  };

  const handleEditLeader = (leader: Leader) => {
    setEditingLeader(leader);
    setLeaderForm({
      leader_name: leader.leader_name,
      leader_role: leader.leader_role,
      leader_bio: leader.leader_bio,
      sort_order: leader.sort_order,
      is_active: leader.is_active,
    });
    if (leader.leader_image) {
      const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
      setLeaderImagePreview(`${apiBase}${leader.leader_image}`);
    }
    setShowLeaderModal(true);
  };

  // Admission Page State
  const [admissionSubTab, setAdmissionSubTab] = useState<'important-dates' | 'contact-details'>('important-dates');
  
  // Important Dates
  const { data: importantDates = [], isLoading: datesLoading } = useQuery('admission-important-dates', admissionManagementService.getImportantDates);
  const [showDateModal, setShowDateModal] = useState(false);
  const [editingDate, setEditingDate] = useState<ImportantDate | null>(null);
  const [dateForm, setDateForm] = useState({ title: '', date_value: '', description: '', sort_order: 0, is_active: true });

  const createDateMutation = useMutation(admissionManagementService.createImportantDate, {
    onSuccess: () => {
      queryClient.invalidateQueries('admission-important-dates');
      showToast('Important date created successfully', 'success');
      setShowDateModal(false);
      resetDateForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create important date', 'error');
    },
  });

  const updateDateMutation = useMutation(({ id, data }: { id: number; data: Partial<ImportantDate> }) => admissionManagementService.updateImportantDate(id, data), {
    onSuccess: () => {
      queryClient.invalidateQueries('admission-important-dates');
      showToast('Important date updated successfully', 'success');
      setShowDateModal(false);
      resetDateForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update important date', 'error');
    },
  });

  const deleteDateMutation = useMutation(admissionManagementService.deleteImportantDate, {
    onSuccess: () => {
      queryClient.invalidateQueries('admission-important-dates');
      showToast('Important date deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete important date', 'error');
    },
  });

  const resetDateForm = () => {
    setDateForm({ title: '', date_value: '', description: '', sort_order: 0, is_active: true });
    setEditingDate(null);
  };

  const handleEditDate = (date: ImportantDate) => {
    setEditingDate(date);
    setDateForm({
      title: date.title,
      date_value: date.date_value,
      description: date.description || '',
      sort_order: date.sort_order,
      is_active: date.is_active,
    });
    setShowDateModal(true);
  };

  // Contact Details
  const { data: contactDetails, isLoading: contactLoading } = useQuery('admission-contact-details', admissionManagementService.getContactDetails);
  const [contactForm, setContactForm] = useState({
    call_us_numbers: [] as string[],
    email_us_addresses: [] as string[],
    visit_us_address: '',
    office_hours: '',
    important_dates_visible: true,
    contact_details_visible: true,
  });

  useEffect(() => {
    if (contactDetails) {
      try {
        const callNumbers = contactDetails.call_us_numbers ? JSON.parse(contactDetails.call_us_numbers) : [];
        const emailAddresses = contactDetails.email_us_addresses ? JSON.parse(contactDetails.email_us_addresses) : [];
        setContactForm({
          call_us_numbers: Array.isArray(callNumbers) ? callNumbers : [],
          email_us_addresses: Array.isArray(emailAddresses) ? emailAddresses : [],
          visit_us_address: contactDetails.visit_us_address || '',
          office_hours: contactDetails.office_hours || '',
          important_dates_visible: contactDetails.important_dates_visible !== false,
          contact_details_visible: contactDetails.contact_details_visible !== false,
        });
      } catch (e) {
        console.error('Error parsing contact details:', e);
      }
    }
  }, [contactDetails]);

  const updateContactMutation = useMutation(admissionManagementService.updateContactDetails, {
    onSuccess: () => {
      queryClient.invalidateQueries('admission-contact-details');
      showToast('Contact details updated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update contact details', 'error');
    },
  });

  // Gallery Management State
  const [gallerySubTab, setGallerySubTab] = useState<'categories' | 'images'>('categories');
  
  // Gallery Categories
  const { data: galleryCategories = [], isLoading: categoriesLoading } = useQuery('gallery-categories', galleryManagementService.getCategories);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<GalleryCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', sort_order: 0, is_active: true });

  const createCategoryMutation = useMutation(galleryManagementService.createCategory, {
    onSuccess: () => {
      queryClient.invalidateQueries('gallery-categories');
      showToast('Category created successfully', 'success');
      setShowCategoryModal(false);
      setCategoryForm({ name: '', description: '', sort_order: 0, is_active: true });
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create category', 'error');
    },
  });

  const updateCategoryMutation = useMutation(({ id, data }: { id: number; data: Partial<GalleryCategory> }) => galleryManagementService.updateCategory(id, data), {
    onSuccess: () => {
      queryClient.invalidateQueries('gallery-categories');
      queryClient.invalidateQueries('gallery-images');
      showToast('Category updated successfully', 'success');
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', sort_order: 0, is_active: true });
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update category', 'error');
    },
  });

  const deleteCategoryMutation = useMutation(galleryManagementService.deleteCategory, {
    onSuccess: () => {
      queryClient.invalidateQueries('gallery-categories');
      queryClient.invalidateQueries('gallery-images');
      showToast('Category deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete category', 'error');
    },
  });

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', description: '', sort_order: 0, is_active: true });
    setEditingCategory(null);
  };

  const handleEditCategory = (category: GalleryCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      sort_order: category.sort_order,
      is_active: category.is_active,
    });
    setShowCategoryModal(true);
  };

  // Gallery Images
  const [selectedCategoryForImages, setSelectedCategoryForImages] = useState<number | undefined>(undefined);
  const { data: galleryImages = [], isLoading: imagesLoading } = useQuery(
    ['gallery-images', selectedCategoryForImages],
    () => galleryManagementService.getImages(selectedCategoryForImages)
  );
  const [showImageModal, setShowImageModal] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [imageForm, setImageForm] = useState({ category_id: '', title: '', description: '', sort_order: 0, is_active: true });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const createImageMutation = useMutation((formData: FormData) => galleryManagementService.createImage(formData), {
    onSuccess: () => {
      queryClient.invalidateQueries('gallery-images');
      showToast('Image uploaded successfully', 'success');
      setShowImageModal(false);
      resetImageForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to upload image', 'error');
    },
  });

  const updateImageMutation = useMutation(({ id, formData }: { id: number; formData: FormData }) => galleryManagementService.updateImage(id, formData), {
    onSuccess: () => {
      queryClient.invalidateQueries('gallery-images');
      showToast('Image updated successfully', 'success');
      setShowImageModal(false);
      resetImageForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update image', 'error');
    },
  });

  const deleteImageMutation = useMutation(galleryManagementService.deleteImage, {
    onSuccess: () => {
      queryClient.invalidateQueries('gallery-images');
      showToast('Image deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete image', 'error');
    },
  });

  const resetImageForm = () => {
    setImageForm({ category_id: '', title: '', description: '', sort_order: 0, is_active: true });
    setEditingImage(null);
    setImagePreview(null);
    setImageFile(null);
  };

  const handleEditImage = (image: GalleryImage) => {
    setEditingImage(image);
    setImageForm({
      category_id: image.category_id.toString(),
      title: image.title,
      description: image.description || '',
      sort_order: image.sort_order,
      is_active: image.is_active,
    });
    setImagePreview(getImageUrl(image.image_path));
    setShowImageModal(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('category_id', imageForm.category_id);
    formData.append('title', imageForm.title);
    formData.append('description', imageForm.description);
    formData.append('sort_order', imageForm.sort_order.toString());
    formData.append('is_active', imageForm.is_active.toString());
    if (imageFile) {
      formData.append('image', imageFile);
    }

    if (editingImage) {
      updateImageMutation.mutate({ id: editingImage.id!, formData });
    } else {
      createImageMutation.mutate(formData);
    }
  };

  // News Management State
  const { data: newsArticles = [], isLoading: newsLoading } = useQuery('news-articles', () => newsEventsManagementService.getNewsArticles());
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  const [newsForm, setNewsForm] = useState({ title: '', excerpt: '', content: '', category: 'general', author: '', published_date: '', is_featured: false, is_active: true });
  const [newsImagePreview, setNewsImagePreview] = useState<string | null>(null);
  const [newsImageFile, setNewsImageFile] = useState<File | null>(null);

  const createNewsMutation = useMutation((formData: FormData) => newsEventsManagementService.createNewsArticle(formData), {
    onSuccess: () => {
      queryClient.invalidateQueries('news-articles');
      showToast('News article created successfully', 'success');
      setShowNewsModal(false);
      resetNewsForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create news article', 'error');
    },
  });

  const updateNewsMutation = useMutation(({ id, formData }: { id: number; formData: FormData }) => newsEventsManagementService.updateNewsArticle(id, formData), {
    onSuccess: () => {
      queryClient.invalidateQueries('news-articles');
      showToast('News article updated successfully', 'success');
      setShowNewsModal(false);
      resetNewsForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update news article', 'error');
    },
  });

  const deleteNewsMutation = useMutation(newsEventsManagementService.deleteNewsArticle, {
    onSuccess: () => {
      queryClient.invalidateQueries('news-articles');
      showToast('News article deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete news article', 'error');
    },
  });

  const resetNewsForm = () => {
    setNewsForm({ title: '', excerpt: '', content: '', category: 'general', author: '', published_date: '', is_featured: false, is_active: true });
    setEditingNews(null);
    setNewsImagePreview(null);
    setNewsImageFile(null);
  };

  const handleEditNews = (article: NewsArticle) => {
    setEditingNews(article);
    setNewsForm({
      title: article.title,
      excerpt: article.excerpt || '',
      content: article.content,
      category: article.category,
      author: article.author || '',
      published_date: article.published_date,
      is_featured: article.is_featured,
      is_active: article.is_active,
    });
    setNewsImagePreview(article.featured_image ? getImageUrl(article.featured_image) : null);
    setShowNewsModal(true);
  };

  const handleNewsImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewsImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewsImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNewsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', newsForm.title);
    formData.append('excerpt', newsForm.excerpt);
    formData.append('content', newsForm.content);
    formData.append('category', newsForm.category);
    formData.append('author', newsForm.author);
    formData.append('published_date', newsForm.published_date);
    formData.append('is_featured', newsForm.is_featured.toString());
    formData.append('is_active', newsForm.is_active.toString());
    if (newsImageFile) {
      formData.append('featured_image', newsImageFile);
    }

    if (editingNews) {
      updateNewsMutation.mutate({ id: editingNews.id!, formData });
    } else {
      createNewsMutation.mutate(formData);
    }
  };

  // Events Management State
  const { data: events = [], isLoading: eventsLoading } = useQuery('events', () => newsEventsManagementService.getEvents());
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState({ title: '', description: '', category: 'general', event_date: '', event_time: '', end_date: '', end_time: '', venue: '', is_featured: false, is_active: true });
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(null);
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);

  const createEventMutation = useMutation((formData: FormData) => newsEventsManagementService.createEvent(formData), {
    onSuccess: () => {
      queryClient.invalidateQueries('events');
      showToast('Event created successfully', 'success');
      setShowEventModal(false);
      resetEventForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create event', 'error');
    },
  });

  const updateEventMutation = useMutation(({ id, formData }: { id: number; formData: FormData }) => newsEventsManagementService.updateEvent(id, formData), {
    onSuccess: () => {
      queryClient.invalidateQueries('events');
      showToast('Event updated successfully', 'success');
      setShowEventModal(false);
      resetEventForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update event', 'error');
    },
  });

  const deleteEventMutation = useMutation(newsEventsManagementService.deleteEvent, {
    onSuccess: () => {
      queryClient.invalidateQueries('events');
      showToast('Event deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete event', 'error');
    },
  });

  const resetEventForm = () => {
    setEventForm({ title: '', description: '', category: 'general', event_date: '', event_time: '', end_date: '', end_time: '', venue: '', is_featured: false, is_active: true });
    setEditingEvent(null);
    setEventImagePreview(null);
    setEventImageFile(null);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      category: event.category,
      event_date: event.event_date,
      event_time: event.event_time || '',
      end_date: event.end_date || '',
      end_time: event.end_time || '',
      venue: event.venue || '',
      is_featured: event.is_featured,
      is_active: event.is_active,
    });
    setEventImagePreview(event.featured_image ? getImageUrl(event.featured_image) : null);
    setShowEventModal(true);
  };

  const handleEventImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEventImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEventImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', eventForm.title);
    formData.append('description', eventForm.description);
    formData.append('category', eventForm.category);
    formData.append('event_date', eventForm.event_date);
    formData.append('event_time', eventForm.event_time);
    formData.append('end_date', eventForm.end_date);
    formData.append('end_time', eventForm.end_time);
    formData.append('venue', eventForm.venue);
    formData.append('is_featured', eventForm.is_featured.toString());
    formData.append('is_active', eventForm.is_active.toString());
    if (eventImageFile) {
      formData.append('featured_image', eventImageFile);
    }

    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent.id!, formData });
    } else {
      createEventMutation.mutate(formData);
    }
  };

  const getImageUrl = (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    return `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
  };

  if (settingsLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="front-cms-website">
      <div className="page-header">
        <h1>Front CMS Website Management</h1>
        <p>Configure your school website header, homepage banners, and about us page</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'header' ? 'active' : ''}`}
          onClick={() => setActiveTab('header')}
        >
          Header Configuration
        </button>
        <button
          className={`tab ${activeTab === 'banners' ? 'active' : ''}`}
          onClick={() => setActiveTab('banners')}
        >
          Home Page Banners
        </button>
        <button
          className={`tab ${activeTab === 'about-us' ? 'active' : ''}`}
          onClick={() => setActiveTab('about-us')}
        >
          About Us Page Config
        </button>
        <button
          className={`tab ${activeTab === 'admission' ? 'active' : ''}`}
          onClick={() => setActiveTab('admission')}
        >
          Admission Page Config
        </button>
        <button
          className={`tab ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          Gallery Management
        </button>
        <button
          className={`tab ${activeTab === 'news' ? 'active' : ''}`}
          onClick={() => setActiveTab('news')}
        >
          News Management
        </button>
        <button
          className={`tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Events Management
        </button>
      </div>

      {/* Header Configuration Tab */}
      {activeTab === 'header' && (
        <div className="tab-content">
          <form onSubmit={handleSettingsSubmit} className="settings-form">
            <div className="form-section">
              <h2>Header Configuration</h2>

              {/* Logo Upload */}
              <div className="form-group">
                <label>Website Logo</label>
                <div className="logo-upload-section">
                  {logoPreview && (
                    <div className="logo-preview">
                      <img src={logoPreview} alt="Logo preview" />
                      <button
                        type="button"
                        className="remove-logo-btn"
                        onClick={() => {
                          setLogoPreview(null);
                          setLogoFile(null);
                          setSettingsForm({ ...settingsForm, website_logo: null });
                        }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="file-input"
                  />
                  <p className="help-text">Recommended size: 200x60px. Max file size: 5MB</p>
                </div>
              </div>

              {/* School Name */}
              <div className="form-group">
                <label>School Name *</label>
                <input
                  type="text"
                  value={settingsForm.school_name || ''}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, school_name: e.target.value })
                  }
                  required
                  placeholder="Enter school name"
                />
              </div>

              {/* Tag Line */}
              <div className="form-group">
                <label>Tag Line</label>
                <input
                  type="text"
                  value={settingsForm.tag_line || ''}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, tag_line: e.target.value })
                  }
                  placeholder="A School with a Difference"
                />
                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={settingsForm.tag_line_visible !== false}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, tag_line_visible: e.target.checked })
                      }
                    />
                    Show tag line in header
                  </label>
                </div>
              </div>

              {/* Contact Information */}
              <h3>Contact Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={settingsForm.contact_email || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, contact_email: e.target.value })
                    }
                    placeholder="info@schoolname.edu"
                  />
                </div>
                <div className="form-group">
                  <label>Contact Number</label>
                  <input
                    type="tel"
                    value={settingsForm.contact_phone || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, contact_phone: e.target.value })
                    }
                    placeholder="+91 1234567890"
                  />
                </div>
              </div>

              {/* Social Media Links */}
              <h3>Social Media Links</h3>
              <p className="section-description">
                Configure social media URLs and enable/disable each icon
              </p>

              {[
                { key: 'facebook', label: 'Facebook', icon: 'fab fa-facebook-f' },
                { key: 'twitter', label: 'Twitter', icon: 'fab fa-twitter' },
                { key: 'youtube', label: 'YouTube', icon: 'fab fa-youtube' },
                { key: 'instagram', label: 'Instagram', icon: 'fab fa-instagram' },
                { key: 'linkedin', label: 'LinkedIn', icon: 'fab fa-linkedin-in' },
                { key: 'whatsapp', label: 'WhatsApp', icon: 'fab fa-whatsapp' },
              ].map((social) => {
                const enabledKey = `${social.key}_enabled` as keyof WebsiteSettings;
                const urlKey = `${social.key}_url` as keyof WebsiteSettings;
                return (
                  <div key={social.key} className="social-media-item">
                    <div className="social-header">
                      <div className="social-info">
                        <i className={social.icon}></i>
                        <span>{social.label}</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settingsForm[enabledKey] as boolean || false}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              [enabledKey]: e.target.checked,
                            })
                          }
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    {settingsForm[enabledKey] && (
                      <input
                        type="url"
                        value={(settingsForm[urlKey] as string) || ''}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, [urlKey]: e.target.value })
                        }
                        placeholder={`https://${social.key}.com/yourpage`}
                        className="social-url-input"
                      />
                    )}
                  </div>
                );
              })}

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={updateSettingsMutation.isLoading}
                >
                  {updateSettingsMutation.isLoading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Banners Tab */}
      {activeTab === 'banners' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Home Page Banners</h2>
            <button
              className="btn-primary"
              onClick={() => {
                resetBannerForm();
                setShowBannerModal(true);
              }}
            >
              <i className="fas fa-plus"></i> Add Banner
            </button>
          </div>

          {bannersLoading ? (
            <div className="loading">Loading banners...</div>
          ) : banners.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-image"></i>
              <p>No banners added yet. Click "Add Banner" to create your first banner.</p>
            </div>
          ) : (
            <div className="banners-grid">
              {banners.map((banner) => (
                <div key={banner.id} className="banner-card">
                  <div className="banner-image">
                    <img src={getImageUrl(banner.image_path)} alt={banner.title} />
                    {!banner.is_active && <div className="inactive-badge">Inactive</div>}
                  </div>
                  <div className="banner-info">
                    <h3>{banner.title}</h3>
                    {banner.description && <p>{banner.description.substring(0, 100)}...</p>}
                    <div className="banner-meta">
                      <span>Order: {banner.sort_order}</span>
                      {banner.button_text && <span>Button: {banner.button_text}</span>}
                    </div>
                    <div className="banner-actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleEditBanner(banner)}
                      >
                        <i className="fas fa-edit"></i> Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteBanner(banner.id!)}
                      >
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Banner Modal */}
      {showBannerModal && (
        <Modal
          isOpen={showBannerModal}
          title={editingBanner ? 'Edit Banner' : 'Add Banner'}
          onClose={() => {
            setShowBannerModal(false);
            resetBannerForm();
          }}
          size="large"
        >
          <form onSubmit={handleBannerSubmit} className="banner-form">
            <div className="form-group">
              <label>Banner Title *</label>
              <input
                type="text"
                value={bannerForm.title}
                onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                required
                placeholder="Enter banner title"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={bannerForm.description}
                onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                rows={4}
                placeholder="Enter banner description"
              />
            </div>

            <div className="form-group">
              <label>Banner Image {!editingBanner && '*'}</label>
              {bannerImagePreview && (
                <div className="image-preview">
                  <img src={bannerImagePreview} alt="Banner preview" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerImageChange}
                className="file-input"
                required={!editingBanner}
              />
              <p className="help-text">Recommended size: 1920x600px. Max file size: 10MB</p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Button Text</label>
                <input
                  type="text"
                  value={bannerForm.button_text}
                  onChange={(e) => setBannerForm({ ...bannerForm, button_text: e.target.value })}
                  placeholder="e.g., Enroll Today"
                />
              </div>
              <div className="form-group">
                <label>Button URL</label>
                <input
                  type="url"
                  value={bannerForm.button_url}
                  onChange={(e) => setBannerForm({ ...bannerForm, button_url: e.target.value })}
                  placeholder="https://example.com or /admission"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Sort Order</label>
                <input
                  type="number"
                  value={bannerForm.sort_order}
                  onChange={(e) =>
                    setBannerForm({ ...bannerForm, sort_order: parseInt(e.target.value) || 0 })
                  }
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={bannerForm.is_active}
                    onChange={(e) =>
                      setBannerForm({ ...bannerForm, is_active: e.target.checked })
                    }
                  />
                  Active
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowBannerModal(false);
                  resetBannerForm();
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={
                  createBannerMutation.isLoading || updateBannerMutation.isLoading
                }
              >
                {createBannerMutation.isLoading || updateBannerMutation.isLoading
                  ? 'Saving...'
                  : editingBanner
                  ? 'Update Banner'
                  : 'Create Banner'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* About Us Page Tab */}
      {activeTab === 'about-us' && (
        <div className="tab-content">
          <div className="about-us-sub-tabs">
            <button className={`tab ${aboutUsSubTab === 'mission-vision' ? 'active' : ''}`} onClick={() => setAboutUsSubTab('mission-vision')}>
              Mission & Vision
            </button>
            <button className={`tab ${aboutUsSubTab === 'counters' ? 'active' : ''}`} onClick={() => setAboutUsSubTab('counters')}>
              Counters
            </button>
            <button className={`tab ${aboutUsSubTab === 'history' ? 'active' : ''}`} onClick={() => setAboutUsSubTab('history')}>
              History
            </button>
            <button className={`tab ${aboutUsSubTab === 'values' ? 'active' : ''}`} onClick={() => setAboutUsSubTab('values')}>
              Core Values
            </button>
            <button className={`tab ${aboutUsSubTab === 'achievements' ? 'active' : ''}`} onClick={() => setAboutUsSubTab('achievements')}>
              Achievements
            </button>
            <button className={`tab ${aboutUsSubTab === 'leadership' ? 'active' : ''}`} onClick={() => setAboutUsSubTab('leadership')}>
              Leadership
            </button>
          </div>

          <div className="tab-panel">
            {/* Mission & Vision Sub-tab */}
            {aboutUsSubTab === 'mission-vision' && (
              <div>
                <h2>Mission & Vision</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateMvMutation.mutate(mvForm);
                  }}
                >
                  <div className="form-group">
                    <label>Mission Content *</label>
                    <textarea
                      rows={6}
                      value={mvForm.mission_content}
                      onChange={(e) => setMvForm({ ...mvForm, mission_content: e.target.value })}
                      required
                      placeholder="Enter mission content..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Vision Content *</label>
                    <textarea
                      rows={6}
                      value={mvForm.vision_content}
                      onChange={(e) => setMvForm({ ...mvForm, vision_content: e.target.value })}
                      required
                      placeholder="Enter vision content..."
                    />
                  </div>
                  <button type="submit" className="btn-primary" disabled={updateMvMutation.isLoading}>
                    {updateMvMutation.isLoading ? 'Saving...' : 'Save Mission & Vision'}
                  </button>
                </form>
              </div>
            )}

            {/* Counters Sub-tab */}
            {aboutUsSubTab === 'counters' && (
              <div>
                <div className="section-header">
                  <h2>Counters / Statistics</h2>
                  <button className="btn-primary" onClick={() => { resetCounterForm(); setShowCounterModal(true); }}>
                    <i className="fas fa-plus"></i> Add Counter
                  </button>
                </div>
                {countersLoading ? (
                  <div className="loading">Loading counters...</div>
                ) : counters.length === 0 ? (
                  <div className="empty-state">No counters added yet. Click "Add Counter" to create one.</div>
                ) : (
                  <div className="items-grid">
                    {counters.map((counter) => (
                      <div key={counter.id} className="item-card">
                        <div className="item-content">
                          <h3>{counter.counter_number}</h3>
                          <p>{counter.counter_label}</p>
                          <span className={`badge ${counter.is_active ? 'active' : 'inactive'}`}>
                            {counter.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="item-actions">
                          <button className="btn-edit" onClick={() => handleEditCounter(counter)}>
                            <i className="fas fa-edit"></i> Edit
                          </button>
                          <button className="btn-delete" onClick={() => deleteCounterMutation.mutate(counter.id!)}>
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* History Sub-tab */}
            {aboutUsSubTab === 'history' && (
              <div>
                <h2>Our History</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateHistoryMutation.mutate({
                      data: { history_content: historyForm.history_content, history_image: history?.history_image },
                      imageFile: historyImageFile,
                    });
                  }}
                >
                  <div className="form-group">
                    <label>History Content *</label>
                    <textarea
                      rows={10}
                      value={historyForm.history_content}
                      onChange={(e) => setHistoryForm({ history_content: e.target.value })}
                      required
                      placeholder="Enter history content..."
                    />
                  </div>
                  <div className="form-group">
                    <label>History Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setHistoryImageFile(file);
                          setHistoryImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                    {historyImagePreview && (
                      <div className="image-preview">
                        <img src={historyImagePreview} alt="History preview" />
                      </div>
                    )}
                    {!historyImagePreview && history?.history_image && (
                      <p>Current Image: <a href={getImageUrl(history.history_image)} target="_blank" rel="noopener noreferrer">View</a></p>
                    )}
                  </div>
                  <button type="submit" className="btn-primary" disabled={updateHistoryMutation.isLoading}>
                    {updateHistoryMutation.isLoading ? 'Saving...' : 'Save History'}
                  </button>
                </form>
              </div>
            )}

            {/* Core Values Sub-tab */}
            {aboutUsSubTab === 'values' && (
              <div>
                <div className="section-header">
                  <h2>Core Values (Max 5 cards)</h2>
                  <button
                    className="btn-primary"
                    onClick={() => { resetValueForm(); setShowValueModal(true); }}
                    disabled={values.length >= 5}
                  >
                    <i className="fas fa-plus"></i> Add Core Value {values.length >= 5 && '(Max 5)'}
                  </button>
                </div>
                {valuesLoading ? (
                  <div className="loading">Loading core values...</div>
                ) : values.length === 0 ? (
                  <div className="empty-state">No core values added yet. Click "Add Core Value" to create one.</div>
                ) : (
                  <div className="items-grid">
                    {values.map((value) => (
                      <div key={value.id} className="item-card">
                        <div className="item-content">
                          <i className={value.icon_class} style={{ fontSize: '2rem', marginBottom: '0.5rem' }}></i>
                          <h3>{value.title}</h3>
                          <p>{value.description}</p>
                          <span className={`badge ${value.is_active ? 'active' : 'inactive'}`}>
                            {value.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="item-actions">
                          <button className="btn-edit" onClick={() => handleEditValue(value)}>
                            <i className="fas fa-edit"></i> Edit
                          </button>
                          <button className="btn-delete" onClick={() => deleteValueMutation.mutate(value.id!)}>
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Achievements Sub-tab */}
            {aboutUsSubTab === 'achievements' && (
              <div>
                <div className="section-header">
                  <h2>Achievements</h2>
                  <button className="btn-primary" onClick={() => { resetAchievementForm(); setShowAchievementModal(true); }}>
                    <i className="fas fa-plus"></i> Add Achievement
                  </button>
                </div>
                {achievementsLoading ? (
                  <div className="loading">Loading achievements...</div>
                ) : achievements.length === 0 ? (
                  <div className="empty-state">No achievements added yet. Click "Add Achievement" to create one.</div>
                ) : (
                  <div className="items-list">
                    {achievements.map((achievement) => (
                      <div key={achievement.id} className="item-card">
                        <div className="item-content">
                          <div className="achievement-year">{achievement.achievement_year}</div>
                          <div>
                            <h3>{achievement.achievement_title}</h3>
                            <p>{achievement.achievement_description}</p>
                          </div>
                          <span className={`badge ${achievement.is_active ? 'active' : 'inactive'}`}>
                            {achievement.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="item-actions">
                          <button className="btn-edit" onClick={() => handleEditAchievement(achievement)}>
                            <i className="fas fa-edit"></i> Edit
                          </button>
                          <button className="btn-delete" onClick={() => deleteAchievementMutation.mutate(achievement.id!)}>
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Leadership Sub-tab */}
            {aboutUsSubTab === 'leadership' && (
              <div>
                <div className="section-header">
                  <h2>Leadership</h2>
                  <button className="btn-primary" onClick={() => { resetLeaderForm(); setShowLeaderModal(true); }}>
                    <i className="fas fa-plus"></i> Add Leader
                  </button>
                </div>
                {leadershipLoading ? (
                  <div className="loading">Loading leadership...</div>
                ) : leadership.length === 0 ? (
                  <div className="empty-state">No leaders added yet. Click "Add Leader" to create one.</div>
                ) : (
                  <div className="items-grid">
                    {leadership.map((leader) => (
                      <div key={leader.id} className="item-card">
                        <div className="item-content">
                          {leader.leader_image && (
                            <img src={getImageUrl(leader.leader_image)} alt={leader.leader_name} className="leader-image" />
                          )}
                          <h3>{leader.leader_name}</h3>
                          <p className="leader-role">{leader.leader_role}</p>
                          <p>{leader.leader_bio}</p>
                          <span className={`badge ${leader.is_active ? 'active' : 'inactive'}`}>
                            {leader.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="item-actions">
                          <button className="btn-edit" onClick={() => handleEditLeader(leader)}>
                            <i className="fas fa-edit"></i> Edit
                          </button>
                          <button className="btn-delete" onClick={() => deleteLeaderMutation.mutate(leader.id!)}>
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admission Page Tab */}
      {activeTab === 'admission' && (
        <div className="tab-content">
          <div className="about-us-sub-tabs">
            <button className={`tab ${admissionSubTab === 'important-dates' ? 'active' : ''}`} onClick={() => setAdmissionSubTab('important-dates')}>
              Important Dates
            </button>
            <button className={`tab ${admissionSubTab === 'contact-details' ? 'active' : ''}`} onClick={() => setAdmissionSubTab('contact-details')}>
              Contact Details
            </button>
          </div>

          <div className="tab-panel">
            {/* Important Dates Sub-tab */}
            {admissionSubTab === 'important-dates' && (
              <div>
                <div className="section-header">
                  <h2>Important Dates</h2>
                  <button className="btn-primary" onClick={() => { resetDateForm(); setShowDateModal(true); }}>
                    <i className="fas fa-plus"></i> Add Important Date
                  </button>
                </div>
                {datesLoading ? (
                  <div className="loading">Loading important dates...</div>
                ) : importantDates.length === 0 ? (
                  <div className="empty-state">No important dates added yet. Click "Add Important Date" to create one.</div>
                ) : (
                  <div className="items-list">
                    {importantDates.map((date) => (
                      <div key={date.id} className="item-card">
                        <div className="item-content">
                          <div>
                            <h3>{date.title}</h3>
                            <p className="date-value">{new Date(date.date_value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            {date.description && <p>{date.description}</p>}
                          </div>
                          <span className={`badge ${date.is_active ? 'active' : 'inactive'}`}>
                            {date.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="item-actions">
                          <button className="btn-edit" onClick={() => handleEditDate(date)}>
                            <i className="fas fa-edit"></i> Edit
                          </button>
                          <button className="btn-delete" onClick={() => deleteDateMutation.mutate(date.id!)}>
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Contact Details Sub-tab */}
            {admissionSubTab === 'contact-details' && (
              <div>
                <h2>Contact Details</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateContactMutation.mutate({
                      call_us_numbers: contactForm.call_us_numbers,
                      email_us_addresses: contactForm.email_us_addresses,
                      visit_us_address: contactForm.visit_us_address,
                      office_hours: contactForm.office_hours,
                      important_dates_visible: contactForm.important_dates_visible,
                      contact_details_visible: contactForm.contact_details_visible,
                    });
                  }}
                >
                  <div className="form-group">
                    <label>Call Us Numbers (one per line)</label>
                    <textarea
                      rows={4}
                      value={contactForm.call_us_numbers.join('\n')}
                      onChange={(e) => setContactForm({ ...contactForm, call_us_numbers: e.target.value.split('\n').filter(n => n.trim()) })}
                      placeholder="+91 1234567890&#10;+91 9876543210"
                    />
                    <small>Enter phone numbers, one per line</small>
                  </div>
                  <div className="form-group">
                    <label>Email Us Addresses (one per line)</label>
                    <textarea
                      rows={4}
                      value={contactForm.email_us_addresses.join('\n')}
                      onChange={(e) => setContactForm({ ...contactForm, email_us_addresses: e.target.value.split('\n').filter(e => e.trim()) })}
                      placeholder="admissions@schoolname.edu&#10;info@schoolname.edu"
                    />
                    <small>Enter email addresses, one per line</small>
                  </div>
                  <div className="form-group">
                    <label>Visit Us Address</label>
                    <textarea
                      rows={3}
                      value={contactForm.visit_us_address}
                      onChange={(e) => setContactForm({ ...contactForm, visit_us_address: e.target.value })}
                      placeholder="School Address, City&#10;State - PIN Code"
                    />
                  </div>
                  <div className="form-group">
                    <label>Office Hours</label>
                    <textarea
                      rows={3}
                      value={contactForm.office_hours}
                      onChange={(e) => setContactForm({ ...contactForm, office_hours: e.target.value })}
                      placeholder="Monday - Friday: 9:00 AM - 5:00 PM&#10;Saturday: 9:00 AM - 1:00 PM"
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={contactForm.important_dates_visible}
                        onChange={(e) => setContactForm({ ...contactForm, important_dates_visible: e.target.checked })}
                      />
                      Show Important Dates section on website
                    </label>
                  </div>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={contactForm.contact_details_visible}
                        onChange={(e) => setContactForm({ ...contactForm, contact_details_visible: e.target.checked })}
                      />
                      Show Contact Details section on website
                    </label>
                  </div>
                  <button type="submit" className="btn-primary" disabled={updateContactMutation.isLoading}>
                    {updateContactMutation.isLoading ? 'Saving...' : 'Save Contact Details'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gallery Management Tab */}
      {activeTab === 'gallery' && (
        <div className="tab-content">
          <div className="about-us-sub-tabs">
            <button className={`tab ${gallerySubTab === 'categories' ? 'active' : ''}`} onClick={() => setGallerySubTab('categories')}>
              Categories
            </button>
            <button className={`tab ${gallerySubTab === 'images' ? 'active' : ''}`} onClick={() => setGallerySubTab('images')}>
              Images
            </button>
          </div>

          <div className="tab-panel">
            {/* Categories Sub-tab */}
            {gallerySubTab === 'categories' && (
              <div>
                <div className="section-header">
                  <h2>Gallery Categories</h2>
                  <button className="btn-primary" onClick={() => { resetCategoryForm(); setShowCategoryModal(true); }}>
                    <i className="fas fa-plus"></i> Add Category
                  </button>
                </div>
                {categoriesLoading ? (
                  <div className="loading">Loading categories...</div>
                ) : galleryCategories.length === 0 ? (
                  <div className="empty-state">No categories added yet. Click "Add Category" to create one.</div>
                ) : (
                  <div className="items-list">
                    {galleryCategories.map((category) => (
                      <div key={category.id} className="item-card">
                        <div className="item-content">
                          <div>
                            <h3>{category.name}</h3>
                            {category.description && <p>{category.description}</p>}
                          </div>
                          <span className={`badge ${category.is_active ? 'active' : 'inactive'}`}>
                            {category.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="item-actions">
                          <button className="btn-edit" onClick={() => handleEditCategory(category)}>
                            <i className="fas fa-edit"></i> Edit
                          </button>
                          <button className="btn-delete" onClick={() => deleteCategoryMutation.mutate(category.id!)}>
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Images Sub-tab */}
            {gallerySubTab === 'images' && (
              <div>
                <div className="section-header">
                  <h2>Gallery Images</h2>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <select
                      value={selectedCategoryForImages || ''}
                      onChange={(e) => setSelectedCategoryForImages(e.target.value ? parseInt(e.target.value) : undefined)}
                      style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                      <option value="">All Categories</option>
                      {galleryCategories.filter(c => c.is_active).map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <button className="btn-primary" onClick={() => { resetImageForm(); setShowImageModal(true); }}>
                      <i className="fas fa-plus"></i> Add Image
                    </button>
                  </div>
                </div>
                {imagesLoading ? (
                  <div className="loading">Loading images...</div>
                ) : galleryImages.length === 0 ? (
                  <div className="empty-state">No images added yet. Click "Add Image" to upload one.</div>
                ) : (
                  <div className="items-list">
                    {galleryImages.map((image) => (
                      <div key={image.id} className="item-card">
                        <div className="item-content" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <img
                            src={getImageUrl(image.image_path)}
                            alt={image.title}
                            style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                          <div style={{ flex: 1 }}>
                            <h3>{image.title}</h3>
                            <p style={{ color: '#666', fontSize: '0.9rem' }}>Category: {image.category_name}</p>
                            {image.description && <p>{image.description}</p>}
                          </div>
                          <span className={`badge ${image.is_active ? 'active' : 'inactive'}`}>
                            {image.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="item-actions">
                          <button className="btn-edit" onClick={() => handleEditImage(image)}>
                            <i className="fas fa-edit"></i> Edit
                          </button>
                          <button className="btn-delete" onClick={() => deleteImageMutation.mutate(image.id!)}>
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* News Management Tab */}
      {activeTab === 'news' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>News Articles</h2>
            <button className="btn-primary" onClick={() => { resetNewsForm(); setShowNewsModal(true); }}>
              <i className="fas fa-plus"></i> Add News Article
            </button>
          </div>
          {newsLoading ? (
            <div className="loading">Loading news articles...</div>
          ) : newsArticles.length === 0 ? (
            <div className="empty-state">No news articles added yet. Click "Add News Article" to create one.</div>
          ) : (
            <div className="items-list">
              {newsArticles.map((article) => (
                <div key={article.id} className="item-card">
                  <div className="item-content" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {article.featured_image && (
                      <img
                        src={getImageUrl(article.featured_image)}
                        alt={article.title}
                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <h3>{article.title}</h3>
                      <p style={{ color: '#666', fontSize: '0.9rem' }}>Category: {article.category} | Published: {new Date(article.published_date).toLocaleDateString()}</p>
                      {article.excerpt && <p>{article.excerpt}</p>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                      {article.is_featured && <span className="badge active">Featured</span>}
                      <span className={`badge ${article.is_active ? 'active' : 'inactive'}`}>
                        {article.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="item-actions">
                    <button className="btn-edit" onClick={() => handleEditNews(article)}>
                      <i className="fas fa-edit"></i> Edit
                    </button>
                    <button className="btn-delete" onClick={() => deleteNewsMutation.mutate(article.id!)}>
                      <i className="fas fa-trash"></i> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Events Management Tab */}
      {activeTab === 'events' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Events</h2>
            <button className="btn-primary" onClick={() => { resetEventForm(); setShowEventModal(true); }}>
              <i className="fas fa-plus"></i> Add Event
            </button>
          </div>
          {eventsLoading ? (
            <div className="loading">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="empty-state">No events added yet. Click "Add Event" to create one.</div>
          ) : (
            <div className="items-list">
              {events.map((event) => (
                <div key={event.id} className="item-card">
                  <div className="item-content" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {event.featured_image && (
                      <img
                        src={getImageUrl(event.featured_image)}
                        alt={event.title}
                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <h3>{event.title}</h3>
                      <p style={{ color: '#666', fontSize: '0.9rem' }}>
                        Category: {event.category} | Date: {new Date(event.event_date).toLocaleDateString()}
                        {event.event_time && ` | Time: ${event.event_time}`}
                        {event.venue && ` | Venue: ${event.venue}`}
                      </p>
                      <p>{event.description}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                      {event.is_featured && <span className="badge active">Featured</span>}
                      <span className={`badge ${event.is_active ? 'active' : 'inactive'}`}>
                        {event.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="item-actions">
                    <button className="btn-edit" onClick={() => handleEditEvent(event)}>
                      <i className="fas fa-edit"></i> Edit
                    </button>
                    <button className="btn-delete" onClick={() => deleteEventMutation.mutate(event.id!)}>
                      <i className="fas fa-trash"></i> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Counter Modal */}
      {showCounterModal && (
        <Modal
          isOpen={showCounterModal}
          title={editingCounter ? 'Edit Counter' : 'Add Counter'}
          onClose={() => { setShowCounterModal(false); resetCounterForm(); }}
          size="medium"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editingCounter) {
                updateCounterMutation.mutate({ id: editingCounter.id!, data: counterForm });
              } else {
                createCounterMutation.mutate(counterForm);
              }
            }}
          >
            <div className="form-group">
              <label>Counter Number *</label>
              <input
                type="text"
                value={counterForm.counter_number}
                onChange={(e) => setCounterForm({ ...counterForm, counter_number: e.target.value })}
                required
                placeholder="e.g., 5000+"
              />
            </div>
            <div className="form-group">
              <label>Counter Label *</label>
              <input
                type="text"
                value={counterForm.counter_label}
                onChange={(e) => setCounterForm({ ...counterForm, counter_label: e.target.value })}
                required
                placeholder="e.g., Students"
              />
            </div>
            <div className="form-group">
              <label>Sort Order</label>
              <input
                type="number"
                value={counterForm.sort_order}
                onChange={(e) => setCounterForm({ ...counterForm, sort_order: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={counterForm.is_active}
                  onChange={(e) => setCounterForm({ ...counterForm, is_active: e.target.checked })}
                />
                Active
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowCounterModal(false); resetCounterForm(); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={createCounterMutation.isLoading || updateCounterMutation.isLoading}>
                {createCounterMutation.isLoading || updateCounterMutation.isLoading ? 'Saving...' : editingCounter ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Value Modal */}
      {showValueModal && (
        <Modal
          isOpen={showValueModal}
          title={editingValue ? 'Edit Core Value' : 'Add Core Value'}
          onClose={() => { setShowValueModal(false); resetValueForm(); }}
          size="medium"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editingValue) {
                updateValueMutation.mutate({ id: editingValue.id!, data: valueForm });
              } else {
                createValueMutation.mutate(valueForm);
              }
            }}
          >
            <div className="form-group">
              <label>Icon Class *</label>
              <input
                type="text"
                value={valueForm.icon_class}
                onChange={(e) => setValueForm({ ...valueForm, icon_class: e.target.value })}
                required
                placeholder="e.g., fas fa-graduation-cap"
              />
              <small>Use Font Awesome icon classes (e.g., fas fa-heart, fas fa-users)</small>
            </div>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={valueForm.title}
                onChange={(e) => setValueForm({ ...valueForm, title: e.target.value })}
                required
                placeholder="e.g., Excellence"
              />
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea
                rows={4}
                value={valueForm.description}
                onChange={(e) => setValueForm({ ...valueForm, description: e.target.value })}
                required
                placeholder="Enter description..."
              />
            </div>
            <div className="form-group">
              <label>Sort Order</label>
              <input
                type="number"
                value={valueForm.sort_order}
                onChange={(e) => setValueForm({ ...valueForm, sort_order: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={valueForm.is_active}
                  onChange={(e) => setValueForm({ ...valueForm, is_active: e.target.checked })}
                />
                Active
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowValueModal(false); resetValueForm(); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={createValueMutation.isLoading || updateValueMutation.isLoading}>
                {createValueMutation.isLoading || updateValueMutation.isLoading ? 'Saving...' : editingValue ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Achievement Modal */}
      {showAchievementModal && (
        <Modal
          isOpen={showAchievementModal}
          title={editingAchievement ? 'Edit Achievement' : 'Add Achievement'}
          onClose={() => { setShowAchievementModal(false); resetAchievementForm(); }}
          size="medium"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editingAchievement) {
                updateAchievementMutation.mutate({ id: editingAchievement.id!, data: achievementForm });
              } else {
                createAchievementMutation.mutate(achievementForm);
              }
            }}
          >
            <div className="form-group">
              <label>Achievement Year *</label>
              <input
                type="text"
                value={achievementForm.achievement_year}
                onChange={(e) => setAchievementForm({ ...achievementForm, achievement_year: e.target.value })}
                required
                placeholder="e.g., 2024"
              />
            </div>
            <div className="form-group">
              <label>Achievement Title *</label>
              <input
                type="text"
                value={achievementForm.achievement_title}
                onChange={(e) => setAchievementForm({ ...achievementForm, achievement_title: e.target.value })}
                required
                placeholder="e.g., Best School Award"
              />
            </div>
            <div className="form-group">
              <label>Achievement Description *</label>
              <textarea
                rows={4}
                value={achievementForm.achievement_description}
                onChange={(e) => setAchievementForm({ ...achievementForm, achievement_description: e.target.value })}
                required
                placeholder="Enter achievement description..."
              />
            </div>
            <div className="form-group">
              <label>Sort Order</label>
              <input
                type="number"
                value={achievementForm.sort_order}
                onChange={(e) => setAchievementForm({ ...achievementForm, sort_order: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={achievementForm.is_active}
                  onChange={(e) => setAchievementForm({ ...achievementForm, is_active: e.target.checked })}
                />
                Active
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowAchievementModal(false); resetAchievementForm(); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={createAchievementMutation.isLoading || updateAchievementMutation.isLoading}>
                {createAchievementMutation.isLoading || updateAchievementMutation.isLoading ? 'Saving...' : editingAchievement ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Leader Modal */}
      {showLeaderModal && (
        <Modal
          isOpen={showLeaderModal}
          title={editingLeader ? 'Edit Leader' : 'Add Leader'}
          onClose={() => { setShowLeaderModal(false); resetLeaderForm(); }}
          size="large"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editingLeader) {
                updateLeaderMutation.mutate({ id: editingLeader.id!, data: leaderForm, imageFile: leaderImageFile });
              } else {
                createLeaderMutation.mutate({ data: leaderForm, imageFile: leaderImageFile });
              }
            }}
          >
            <div className="form-group">
              <label>Leader Name *</label>
              <input
                type="text"
                value={leaderForm.leader_name}
                onChange={(e) => setLeaderForm({ ...leaderForm, leader_name: e.target.value })}
                required
                placeholder="e.g., Dr. John Smith"
              />
            </div>
            <div className="form-group">
              <label>Leader Role *</label>
              <input
                type="text"
                value={leaderForm.leader_role}
                onChange={(e) => setLeaderForm({ ...leaderForm, leader_role: e.target.value })}
                required
                placeholder="e.g., Principal"
              />
            </div>
            <div className="form-group">
              <label>Leader Bio *</label>
              <textarea
                rows={4}
                value={leaderForm.leader_bio}
                onChange={(e) => setLeaderForm({ ...leaderForm, leader_bio: e.target.value })}
                required
                placeholder="Enter leader biography..."
              />
            </div>
            <div className="form-group">
              <label>Leader Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setLeaderImageFile(file);
                    setLeaderImagePreview(URL.createObjectURL(file));
                  }
                }}
              />
              {leaderImagePreview && (
                <div className="image-preview">
                  <img src={leaderImagePreview} alt="Leader preview" />
                </div>
              )}
              {!leaderImagePreview && editingLeader?.leader_image && (
                <p>Current Image: <a href={getImageUrl(editingLeader.leader_image)} target="_blank" rel="noopener noreferrer">View</a></p>
              )}
            </div>
            <div className="form-group">
              <label>Sort Order</label>
              <input
                type="number"
                value={leaderForm.sort_order}
                onChange={(e) => setLeaderForm({ ...leaderForm, sort_order: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={leaderForm.is_active}
                  onChange={(e) => setLeaderForm({ ...leaderForm, is_active: e.target.checked })}
                />
                Active
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowLeaderModal(false); resetLeaderForm(); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={createLeaderMutation.isLoading || updateLeaderMutation.isLoading}>
                {createLeaderMutation.isLoading || updateLeaderMutation.isLoading ? 'Saving...' : editingLeader ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Important Date Modal */}
      {showDateModal && (
        <Modal
          isOpen={showDateModal}
          title={editingDate ? 'Edit Important Date' : 'Add Important Date'}
          onClose={() => { setShowDateModal(false); resetDateForm(); }}
          size="medium"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editingDate) {
                updateDateMutation.mutate({ id: editingDate.id!, data: dateForm });
              } else {
                createDateMutation.mutate(dateForm);
              }
            }}
          >
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={dateForm.title}
                onChange={(e) => setDateForm({ ...dateForm, title: e.target.value })}
                required
                placeholder="e.g., Application Start"
              />
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                value={dateForm.date_value}
                onChange={(e) => setDateForm({ ...dateForm, date_value: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                rows={3}
                value={dateForm.description}
                onChange={(e) => setDateForm({ ...dateForm, description: e.target.value })}
                placeholder="Enter description..."
              />
            </div>
            <div className="form-group">
              <label>Sort Order</label>
              <input
                type="number"
                value={dateForm.sort_order}
                onChange={(e) => setDateForm({ ...dateForm, sort_order: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={dateForm.is_active}
                  onChange={(e) => setDateForm({ ...dateForm, is_active: e.target.checked })}
                />
                Active
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowDateModal(false); resetDateForm(); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={createDateMutation.isLoading || updateDateMutation.isLoading}>
                {createDateMutation.isLoading || updateDateMutation.isLoading ? 'Saving...' : editingDate ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Gallery Category Modal */}
      {showCategoryModal && (
        <Modal
          isOpen={showCategoryModal}
          title={editingCategory ? 'Edit Category' : 'Add Category'}
          onClose={() => { setShowCategoryModal(false); resetCategoryForm(); }}
          size="medium"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editingCategory) {
                updateCategoryMutation.mutate({ id: editingCategory.id!, data: categoryForm });
              } else {
                createCategoryMutation.mutate(categoryForm);
              }
            }}
          >
            <div className="form-group">
              <label>Category Name *</label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                required
                placeholder="e.g., Events, Sports, Academics"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                rows={3}
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Brief description of the category"
              />
            </div>
            <div className="form-group">
              <label>Sort Order</label>
              <input
                type="number"
                value={categoryForm.sort_order}
                onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={categoryForm.is_active}
                  onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                />
                Active
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowCategoryModal(false); resetCategoryForm(); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={createCategoryMutation.isLoading || updateCategoryMutation.isLoading}>
                {createCategoryMutation.isLoading || updateCategoryMutation.isLoading ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Gallery Image Modal */}
      {showImageModal && (
        <Modal
          isOpen={showImageModal}
          title={editingImage ? 'Edit Image' : 'Add Image'}
          onClose={() => { setShowImageModal(false); resetImageForm(); }}
          size="large"
        >
          <form onSubmit={handleImageSubmit}>
            <div className="form-group">
              <label>Category *</label>
              <select
                value={imageForm.category_id}
                onChange={(e) => setImageForm({ ...imageForm, category_id: e.target.value })}
                required
              >
                <option value="">Select a category</option>
                {galleryCategories.filter(c => c.is_active).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={imageForm.title}
                onChange={(e) => setImageForm({ ...imageForm, title: e.target.value })}
                required
                placeholder="e.g., Annual Day Celebration"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                rows={3}
                value={imageForm.description}
                onChange={(e) => setImageForm({ ...imageForm, description: e.target.value })}
                placeholder="Brief description of the image"
              />
            </div>
            <div className="form-group">
              <label>Image {!editingImage && '*'}</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                required={!editingImage}
              />
              {imagePreview && (
                <div style={{ marginTop: '1rem' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px' }}
                  />
                </div>
              )}
              <small>Recommended size: 1200x800px. Max file size: 10MB</small>
            </div>
            <div className="form-group">
              <label>Sort Order</label>
              <input
                type="number"
                value={imageForm.sort_order}
                onChange={(e) => setImageForm({ ...imageForm, sort_order: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={imageForm.is_active}
                  onChange={(e) => setImageForm({ ...imageForm, is_active: e.target.checked })}
                />
                Active
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowImageModal(false); resetImageForm(); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={createImageMutation.isLoading || updateImageMutation.isLoading}>
                {createImageMutation.isLoading || updateImageMutation.isLoading ? 'Saving...' : editingImage ? 'Update' : 'Upload'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* News Article Modal */}
      {showNewsModal && (
        <Modal
          isOpen={showNewsModal}
          title={editingNews ? 'Edit News Article' : 'Add News Article'}
          onClose={() => { setShowNewsModal(false); resetNewsForm(); }}
          size="large"
        >
          <form onSubmit={handleNewsSubmit}>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={newsForm.title}
                onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                required
                placeholder="Enter news title"
              />
            </div>
            <div className="form-group">
              <label>Excerpt</label>
              <textarea
                rows={3}
                value={newsForm.excerpt}
                onChange={(e) => setNewsForm({ ...newsForm, excerpt: e.target.value })}
                placeholder="Brief summary of the news article"
              />
            </div>
            <div className="form-group">
              <label>Content *</label>
              <textarea
                rows={8}
                value={newsForm.content}
                onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                required
                placeholder="Full content of the news article"
              />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select
                value={newsForm.category}
                onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                required
              >
                <option value="general">General</option>
                <option value="academic">Academic</option>
                <option value="sports">Sports</option>
                <option value="events">Events</option>
                <option value="achievements">Achievements</option>
              </select>
            </div>
            <div className="form-group">
              <label>Author</label>
              <input
                type="text"
                value={newsForm.author}
                onChange={(e) => setNewsForm({ ...newsForm, author: e.target.value })}
                placeholder="Author name"
              />
            </div>
            <div className="form-group">
              <label>Published Date *</label>
              <input
                type="date"
                value={newsForm.published_date}
                onChange={(e) => setNewsForm({ ...newsForm, published_date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Featured Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleNewsImageChange}
              />
              {newsImagePreview && (
                <div style={{ marginTop: '1rem' }}>
                  <img
                    src={newsImagePreview}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px' }}
                  />
                </div>
              )}
              <small>Recommended size: 1200x800px. Max file size: 10MB</small>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={newsForm.is_featured}
                  onChange={(e) => setNewsForm({ ...newsForm, is_featured: e.target.checked })}
                />
                Featured
              </label>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={newsForm.is_active}
                  onChange={(e) => setNewsForm({ ...newsForm, is_active: e.target.checked })}
                />
                Active
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowNewsModal(false); resetNewsForm(); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={createNewsMutation.isLoading || updateNewsMutation.isLoading}>
                {createNewsMutation.isLoading || updateNewsMutation.isLoading ? 'Saving...' : editingNews ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <Modal
          isOpen={showEventModal}
          title={editingEvent ? 'Edit Event' : 'Add Event'}
          onClose={() => { setShowEventModal(false); resetEventForm(); }}
          size="large"
        >
          <form onSubmit={handleEventSubmit}>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                required
                placeholder="Enter event title"
              />
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea
                rows={5}
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                required
                placeholder="Event description"
              />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select
                value={eventForm.category}
                onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                required
              >
                <option value="general">General</option>
                <option value="Sports">Sports</option>
                <option value="Academic">Academic</option>
                <option value="Cultural">Cultural</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Event Date *</label>
                <input
                  type="date"
                  value={eventForm.event_date}
                  onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Event Time</label>
                <input
                  type="time"
                  value={eventForm.event_time}
                  onChange={(e) => setEventForm({ ...eventForm, event_time: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={eventForm.end_date}
                  onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  value={eventForm.end_time}
                  onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Venue</label>
              <input
                type="text"
                value={eventForm.venue}
                onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                placeholder="Event venue/location"
              />
            </div>
            <div className="form-group">
              <label>Featured Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleEventImageChange}
              />
              {eventImagePreview && (
                <div style={{ marginTop: '1rem' }}>
                  <img
                    src={eventImagePreview}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px' }}
                  />
                </div>
              )}
              <small>Recommended size: 1200x800px. Max file size: 10MB</small>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={eventForm.is_featured}
                  onChange={(e) => setEventForm({ ...eventForm, is_featured: e.target.checked })}
                />
                Featured
              </label>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={eventForm.is_active}
                  onChange={(e) => setEventForm({ ...eventForm, is_active: e.target.checked })}
                />
                Active
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowEventModal(false); resetEventForm(); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={createEventMutation.isLoading || updateEventMutation.isLoading}>
                {createEventMutation.isLoading || updateEventMutation.isLoading ? 'Saving...' : editingEvent ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default FrontCmsWebsite;

