import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MEMBERSHIP_CATEGORY_TYPE_ID,
  WORKLOCATION_LOOKUPTYPE_ID,
} from '../constants/config';
import { fetchCategoryByTypeId } from '../api/category.api';
import {
  fetchAllCountry,
  fetchAllLookupRequest,
  fetchLookupHierarchyByType,
} from '../api/lookup.api';
import { getBearerToken } from '../helpers/auth.helper';
import {
  mapCategoryOptions,
  mapCountryOptions,
  mapLookupNameOptions,
  mapWorkLocationOptions,
  toWorkLocationLookupItems,
  type LookupOption,
} from '../helpers/applicationPayload.helper';

const CACHE_KEYS = {
  gender: 'mh_genderLookups',
  title: 'mh_titleLookups',
  primarySection: 'mh_primarySection',
  secondarySection: 'mh_secondarySection',
  workLocation: 'mh_workLocationLookups_v2',
  countries: 'mh_countries',
  categories: 'mh_categories',
  grade: 'mh_gradeLookups',
  paymentType: 'mh_paymentTypeLookups',
  studyLocation: 'mh_studyLocationLookups',
  youthForum: 'mh_youthForumLookups',
  discipline: 'mh_disciplineLookups',
} as const;

type LookupContextValue = {
  loading: boolean;
  error: string | null;
  rawLookups: any[];
  workLocationLookups: any[];
  titleOptions: LookupOption[];
  genderOptions: LookupOption[];
  countryOptions: LookupOption[];
  categoryOptions: LookupOption[];
  gradeOptions: LookupOption[];
  workLocationOptions: LookupOption[];
  paymentTypeOptions: LookupOption[];
  studyLocationOptions: LookupOption[];
  youthForumOptions: LookupOption[];
  disciplineOptions: LookupOption[];
  primarySectionOptions: LookupOption[];
  secondarySectionOptions: LookupOption[];
  refreshLookups: () => Promise<void>;
};

const LookupContext = createContext<LookupContextValue | null>(null);

const readCache = async (key: string) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCache = async (key: string, value: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
};

const unwrapList = (response: any): any[] => {
  const root = response?.data?.data ?? response?.data ?? response;
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.results)) return root.results;
  if (Array.isArray(root?.products)) return root.products;
  if (Array.isArray(root?.countries)) return root.countries;
  if (Array.isArray(root?.items)) return root.items;
  return [];
};

export const LookupProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawLookups, setRawLookups] = useState<any[]>([]);
  const [workLocationLookups, setWorkLocationLookups] = useState<any[]>([]);
  const [titleOptions, setTitleOptions] = useState<LookupOption[]>([]);
  const [genderOptions, setGenderOptions] = useState<LookupOption[]>([]);
  const [countryOptions, setCountryOptions] = useState<LookupOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<LookupOption[]>([]);
  const [gradeOptions, setGradeOptions] = useState<LookupOption[]>([]);
  const [workLocationOptions, setWorkLocationOptions] = useState<LookupOption[]>(
    [],
  );
  const [paymentTypeOptions, setPaymentTypeOptions] = useState<LookupOption[]>(
    [],
  );
  const [studyLocationOptions, setStudyLocationOptions] = useState<
    LookupOption[]
  >([]);
  const [youthForumOptions, setYouthForumOptions] = useState<LookupOption[]>(
    [],
  );
  const [disciplineOptions, setDisciplineOptions] = useState<LookupOption[]>(
    [],
  );
  const [primarySectionOptions, setPrimarySectionOptions] = useState<
    LookupOption[]
  >([]);
  const [secondarySectionOptions, setSecondarySectionOptions] = useState<
    LookupOption[]
  >([]);
  const initRef = useRef(false);

  const applyLookupBuckets = useCallback((lookupArray: any[]) => {
    const byType = (typeName: string) =>
      lookupArray.filter(item => {
        const t =
          item?.lookuptypeId?.lookuptype ||
          item?.lookupType?.lookuptype ||
          item?.lookuptype ||
          '';
        return (
          String(t).trim().toLowerCase().replace(/\s+/g, '') ===
          typeName.trim().toLowerCase().replace(/\s+/g, '')
        );
      });

    setRawLookups(lookupArray);

    const titles = mapLookupNameOptions(byType('Title'));
    const genders = mapLookupNameOptions(byType('Gender'));
    const grades = [
      ...mapLookupNameOptions(byType('Grade')),
      { label: 'Other', value: 'other' },
    ];
    const paymentTypes = mapLookupNameOptions(byType('Payment Type'));
    const study = mapLookupNameOptions(byType('Study Location'));
    const youth = mapLookupNameOptions(byType('Youth Forum'));
    const discipline = [
      ...mapLookupNameOptions(byType('Discipline')),
      { label: 'Other', value: 'other' },
    ];
    const primary = mapLookupNameOptions(byType('Section'));
    const secondary = mapLookupNameOptions(byType('Secondary Section'));

    // CRM LookupsSlice: Work Location also comes from flat /lookup.
    // Prefer hierarchy (set by fetchWorkLocations); use flat as fallback / enrich.
    const flatWorkLocations = byType('Work Location');
    if (flatWorkLocations.length) {
      const normalized = toWorkLocationLookupItems(
        flatWorkLocations,
        lookupArray,
      );
      setWorkLocationLookups(prev => {
        if (prev?.length) {
          // Hierarchy already loaded — keep it, but fill missing branch/region from flat
          const byName = new Map(
            normalized.map(n => [
              String(
                n?.lookup?.DisplayName ||
                  n?.lookup?.lookupname ||
                  n?.lookup?.name ||
                  '',
              )
                .trim()
                .toLowerCase(),
              n,
            ]),
          );
          return prev.map(item => {
            const name = String(
              item?.lookup?.DisplayName ||
                item?.lookup?.lookupname ||
                item?.lookup?.name ||
                item?.name ||
                '',
            )
              .trim()
              .toLowerCase();
            const flat = byName.get(name);
            if (!flat) return item;
            return {
              ...item,
              branch: item.branch || flat.branch,
              region: item.region || flat.region,
              lookup: {
                ...(flat.lookup || {}),
                ...(item.lookup || {}),
                processSalaryDeduction:
                  item?.lookup?.processSalaryDeduction ??
                  flat?.lookup?.processSalaryDeduction,
              },
            };
          });
        }
        return normalized;
      });
      const flatOptions = [
        ...mapWorkLocationOptions(normalized),
        { label: 'Other', value: 'other' },
      ];
      setWorkLocationOptions(prev =>
        prev?.length > 1 ? prev : flatOptions,
      );
    }

    setTitleOptions(titles);
    setGenderOptions(genders);
    setGradeOptions(grades);
    setPaymentTypeOptions(paymentTypes);
    setStudyLocationOptions(study);
    setYouthForumOptions(youth);
    setDisciplineOptions(discipline);
    setPrimarySectionOptions(primary);
    setSecondarySectionOptions(secondary);

    writeCache(CACHE_KEYS.title, titles);
    writeCache(CACHE_KEYS.gender, genders);
    writeCache(CACHE_KEYS.grade, grades);
    writeCache(CACHE_KEYS.paymentType, paymentTypes);
    writeCache(CACHE_KEYS.studyLocation, study);
    writeCache(CACHE_KEYS.youthForum, youth);
    writeCache(CACHE_KEYS.discipline, discipline);
    writeCache(CACHE_KEYS.primarySection, primary);
    writeCache(CACHE_KEYS.secondarySection, secondary);
  }, []);

  const fetchLookups = useCallback(async () => {
    const res = await fetchAllLookupRequest();
    if (!(res?.status >= 200 && res?.status < 300)) {
      throw new Error('Failed to fetch lookups');
    }
    applyLookupBuckets(unwrapList(res));
  }, [applyLookupBuckets]);

  const fetchWorkLocations = useCallback(async () => {
    // CRM GetLocationWithHierarky: format=simple embeds branch + region on each item
    const res = await fetchLookupHierarchyByType(WORKLOCATION_LOOKUPTYPE_ID, {
      format: 'simple',
    });
    if (!(res?.status >= 200 && res?.status < 300)) {
      throw new Error('Failed to fetch work locations');
    }
    // CRM: response.data.results | Portal: data.results || data.data || data
    const raw =
      res?.data?.results ||
      res?.data?.data?.results ||
      res?.data?.data ||
      unwrapList(res);
    const list = Array.isArray(raw) ? raw : [];
    // Simple format already nests branch/region — no flat lookup join needed
    const normalized = toWorkLocationLookupItems(list);
    if (normalized.length) {
      setWorkLocationLookups(normalized);
      const options = [
        ...mapWorkLocationOptions(normalized),
        { label: 'Other', value: 'other' },
      ];
      setWorkLocationOptions(options);
      await writeCache(CACHE_KEYS.workLocation, {
        raw: normalized,
        options,
      });
    }
  }, []);

  const fetchCountries = useCallback(async () => {
    const res = await fetchAllCountry();
    if (!(res?.status >= 200 && res?.status < 300)) {
      throw new Error('Failed to fetch countries');
    }
    const options = mapCountryOptions(unwrapList(res));
    setCountryOptions(options);
    await writeCache(CACHE_KEYS.countries, options);
  }, []);

  const fetchCategories = useCallback(async () => {
    const res = await fetchCategoryByTypeId(MEMBERSHIP_CATEGORY_TYPE_ID);
    if (!(res?.status >= 200 && res?.status < 300)) {
      throw new Error('Failed to fetch categories');
    }
    const products =
      res?.data?.data?.products ||
      res?.data?.products ||
      unwrapList(res);
    const options = mapCategoryOptions(products);
    setCategoryOptions(options);
    await writeCache(CACHE_KEYS.categories, options);
  }, []);

  const refreshLookups = useCallback(async () => {
    const token = await getBearerToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await Promise.allSettled([
        fetchLookups(),
        fetchWorkLocations(),
        fetchCountries(),
        fetchCategories(),
      ]);
    } catch (e: any) {
      setError(e?.message || 'Failed to load lookups');
    } finally {
      setLoading(false);
    }
  }, [fetchLookups, fetchWorkLocations, fetchCountries, fetchCategories]);

  useEffect(() => {
    (async () => {
      const [
        title,
        gender,
        grade,
        payment,
        study,
        youth,
        discipline,
        primary,
        secondary,
        work,
        countries,
        categories,
      ] = await Promise.all([
        readCache(CACHE_KEYS.title),
        readCache(CACHE_KEYS.gender),
        readCache(CACHE_KEYS.grade),
        readCache(CACHE_KEYS.paymentType),
        readCache(CACHE_KEYS.studyLocation),
        readCache(CACHE_KEYS.youthForum),
        readCache(CACHE_KEYS.discipline),
        readCache(CACHE_KEYS.primarySection),
        readCache(CACHE_KEYS.secondarySection),
        readCache(CACHE_KEYS.workLocation),
        readCache(CACHE_KEYS.countries),
        readCache(CACHE_KEYS.categories),
      ]);
      if (title) setTitleOptions(title);
      if (gender) setGenderOptions(gender);
      if (grade) setGradeOptions(grade);
      if (payment) setPaymentTypeOptions(payment);
      if (study) setStudyLocationOptions(study);
      if (youth) setYouthForumOptions(youth);
      if (discipline) setDisciplineOptions(discipline);
      if (primary) setPrimarySectionOptions(primary);
      if (secondary) setSecondarySectionOptions(secondary);
      if (work?.options) {
        setWorkLocationOptions(work.options);
        if (work.raw) setWorkLocationLookups(work.raw);
      } else if (Array.isArray(work)) {
        setWorkLocationOptions(work);
      }
      if (countries) setCountryOptions(countries);
      if (categories) setCategoryOptions(categories);
    })();
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    refreshLookups();
  }, [refreshLookups]);

  const value = useMemo(
    () => ({
      loading,
      error,
      rawLookups,
      workLocationLookups,
      titleOptions,
      genderOptions,
      countryOptions,
      categoryOptions,
      gradeOptions,
      workLocationOptions,
      paymentTypeOptions,
      studyLocationOptions,
      youthForumOptions,
      disciplineOptions,
      primarySectionOptions,
      secondarySectionOptions,
      refreshLookups,
    }),
    [
      loading,
      error,
      rawLookups,
      workLocationLookups,
      titleOptions,
      genderOptions,
      countryOptions,
      categoryOptions,
      gradeOptions,
      workLocationOptions,
      paymentTypeOptions,
      studyLocationOptions,
      youthForumOptions,
      disciplineOptions,
      primarySectionOptions,
      secondarySectionOptions,
      refreshLookups,
    ],
  );

  return (
    <LookupContext.Provider value={value}>{children}</LookupContext.Provider>
  );
};

export const useLookup = () => {
  const ctx = useContext(LookupContext);
  if (!ctx) {
    throw new Error('useLookup must be used within LookupProvider');
  }
  return ctx;
};
