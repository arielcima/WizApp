import { useCallback, useEffect, useState } from 'react';
import {
    addBulbToGroup,
    createGroup, deleteGroup,
    loadGroups,
    removeBulbFromGroup, renameGroup,
} from '../services/GroupService';

export function useGroups() {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    loadGroups().then(setGroups);
  }, []);

  const addGroup = useCallback(async (name) => {
    const updated = await createGroup(name);
    setGroups(updated);
  }, []);

  const removeGroup = useCallback(async (groupId) => {
    const updated = await deleteGroup(groupId);
    setGroups(updated);
  }, []);

  const assignBulbToGroup = useCallback(async (groupId, bulbIp) => {
    const updated = await addBulbToGroup(groupId, bulbIp);
    setGroups(updated);
  }, []);

  const unassignBulbFromGroup = useCallback(async (groupId, bulbIp) => {
    const updated = await removeBulbFromGroup(groupId, bulbIp);
    setGroups(updated);
  }, []);

  const updateGroupName = useCallback(async (groupId, name) => {
    const updated = await renameGroup(groupId, name);
    setGroups(updated);
  }, []);

  const getBulbGroup = useCallback((bulbIp) => {
    const group = groups.find((g) => g.bulbIps.includes(bulbIp));
    return group ? group.id : null;
  }, [groups]);

  return {
    groups,
    addGroup,
    removeGroup,
    assignBulbToGroup,
    unassignBulbFromGroup,
    updateGroupName,
    getBulbGroup,
  };
}