/** Study-location → branch/region — Portal_App lookupHierarchy.helper */

const normalizeLookupMatchKey = (value: any) =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const normalizeTypeKey = (name: any) =>
  String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

const isStudyLocationLookupTypeName = (typeName: any) =>
  normalizeTypeKey(typeName) === 'studylocation';

const findLookupRecordById = (id: any, rawLookups: any[]) => {
  if (id == null || id === '') return null;
  const idStr = String(typeof id === 'object' ? id._id || id.id : id);
  return (rawLookups || []).find(
    item => String(item._id || item.id) === idStr,
  );
};

const getLookupDisplayLabel = (record: any) => {
  if (!record) return '';
  return (
    record.lookupname ||
    record.DisplayName ||
    record.displayname ||
    record.label ||
    record.name ||
    ''
  );
};

const resolveRegionFromWorkLocationHierarchy = (
  branchId: any,
  branchName: any,
  workLocationLookups: any[] = [],
) => {
  const branchKey = normalizeLookupMatchKey(branchName);
  const match = (workLocationLookups || []).find((item: any) => {
    const itemBranchId = item?.branch?._id || item?.branch?.id;
    const itemBranchName =
      item?.branch?.DisplayName || item?.branch?.lookupname || '';
    return (
      (branchId && itemBranchId && String(itemBranchId) === String(branchId)) ||
      (branchKey &&
        itemBranchName &&
        normalizeLookupMatchKey(itemBranchName) === branchKey)
    );
  });

  if (!match) return '';
  return match?.region?.DisplayName || match?.region?.lookupname || '';
};

export const resolveBranchRegionFromStudyLocation = (
  selectedLookupIdOrLabel: any,
  studyLocationOptions: any[] = [],
  rawLookups: any[] = [],
  workLocationLookups: any[] = [],
) => {
  const labelKey = normalizeLookupMatchKey(selectedLookupIdOrLabel);

  let matchedOption = studyLocationOptions.find(
    (opt: any) =>
      String(opt.key || opt.value) === String(selectedLookupIdOrLabel),
  );
  if (!matchedOption && labelKey) {
    matchedOption = studyLocationOptions.find(
      (opt: any) => normalizeLookupMatchKey(opt.label) === labelKey,
    );
  }

  const selectedLookupId =
    matchedOption?.key || matchedOption?.value || selectedLookupIdOrLabel;

  const studyRecord = (rawLookups || []).find((item: any) => {
    const type =
      item.lookuptypeName || item.lookuptypeId?.lookuptype || item.type || '';
    if (!isStudyLocationLookupTypeName(type)) return false;
    if (
      selectedLookupId &&
      String(item._id || item.id) === String(selectedLookupId)
    ) {
      return true;
    }
    const keys = [item.lookupname, item.DisplayName, item.label, item.name]
      .filter(Boolean)
      .map(normalizeLookupMatchKey);
    return labelKey && keys.includes(labelKey);
  });

  if (!studyRecord) {
    return { branch: '', region: '' };
  }

  const branchRef = studyRecord.Parentlookupid;
  const branchRecord =
    branchRef && typeof branchRef === 'object' && branchRef.lookupname
      ? branchRef
      : findLookupRecordById(
          branchRef?._id ?? branchRef ?? studyRecord.branch?.id,
          rawLookups,
        );

  if (!branchRecord) {
    const branchFromParentLookup = studyRecord.Parentlookup || '';
    return {
      branch: branchFromParentLookup,
      region: resolveRegionFromWorkLocationHierarchy(
        branchRef,
        branchFromParentLookup,
        workLocationLookups,
      ),
    };
  }

  const regionRef = branchRecord.Parentlookupid;
  const regionRecord =
    regionRef && typeof regionRef === 'object' && regionRef.lookupname
      ? regionRef
      : findLookupRecordById(
          regionRef?._id ?? regionRef ?? branchRecord.region?.id,
          rawLookups,
        );

  const region =
    getLookupDisplayLabel(regionRecord) ||
    resolveRegionFromWorkLocationHierarchy(
      branchRecord._id || branchRecord.id,
      getLookupDisplayLabel(branchRecord),
      workLocationLookups,
    );

  return {
    branch: getLookupDisplayLabel(branchRecord),
    region,
  };
};
