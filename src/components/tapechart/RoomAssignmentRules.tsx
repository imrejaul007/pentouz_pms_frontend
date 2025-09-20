import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const RoomAssignmentRules: React.FC = () => {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Room Assignment Rules</CardTitle>
          <CardDescription>Configure automatic room assignment logic</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Room assignment rules management coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoomAssignmentRules;