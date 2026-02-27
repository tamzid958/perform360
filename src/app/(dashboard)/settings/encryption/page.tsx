"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { Shield, Key, RotateCcw, AlertTriangle } from "lucide-react";

export default function EncryptionSettingsPage() {
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");

  return (
    <div>
      <PageHeader title="Encryption Settings" description="Manage your organization's encryption keys and passphrase" />

      {/* Warning Banner */}
      <div className="flex gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 mb-6 max-w-3xl">
        <AlertTriangle size={20} strokeWidth={1.5} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[14px] font-medium text-amber-800">Critical Security Information</p>
          <p className="text-[13px] text-amber-700 mt-1 leading-relaxed">
            If you lose your encryption passphrase and all recovery codes, evaluation data will be permanently unrecoverable. There is no backdoor. Store your passphrase and recovery codes securely.
          </p>
        </div>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Current Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-50">
                <Shield size={20} strokeWidth={1.5} className="text-green-500" />
              </div>
              <div>
                <CardTitle>Encryption Status</CardTitle>
                <CardDescription>AES-256-GCM encryption is active</CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-[12px] text-gray-500 uppercase tracking-wider">Algorithm</p>
              <p className="text-[14px] font-medium text-gray-900 mt-1">AES-256-GCM</p>
            </div>
            <div>
              <p className="text-[12px] text-gray-500 uppercase tracking-wider">Key Version</p>
              <p className="text-[14px] font-medium text-gray-900 mt-1">v1</p>
            </div>
            <div>
              <p className="text-[12px] text-gray-500 uppercase tracking-wider">Key Derivation</p>
              <p className="text-[14px] font-medium text-gray-900 mt-1">scrypt</p>
            </div>
            <div>
              <p className="text-[12px] text-gray-500 uppercase tracking-wider">Status</p>
              <Badge variant="success" className="mt-1">Active</Badge>
            </div>
          </div>
        </Card>

        {/* Change Passphrase */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-brand-50">
                <Key size={20} strokeWidth={1.5} className="text-brand-500" />
              </div>
              <div>
                <CardTitle>Change Passphrase</CardTitle>
                <CardDescription>Update your encryption passphrase</CardDescription>
              </div>
            </div>
          </CardHeader>
          <form className="space-y-4 mt-4">
            <Input
              id="current-passphrase"
              label="Current Passphrase"
              type="password"
              placeholder="Enter current passphrase"
            />
            <Input
              id="new-passphrase"
              label="New Passphrase"
              type="password"
              placeholder="Enter new passphrase"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
            />
            <Input
              id="confirm-passphrase"
              label="Confirm New Passphrase"
              type="password"
              placeholder="Confirm new passphrase"
              value={confirmPassphrase}
              onChange={(e) => setConfirmPassphrase(e.target.value)}
              error={confirmPassphrase && passphrase !== confirmPassphrase ? "Passphrases do not match" : undefined}
            />
            <Button type="button" disabled={!passphrase || passphrase !== confirmPassphrase}>
              Update Passphrase
            </Button>
          </form>
        </Card>

        {/* Key Rotation */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gray-100">
                <RotateCcw size={20} strokeWidth={1.5} className="text-gray-500" />
              </div>
              <div>
                <CardTitle>Key Rotation</CardTitle>
                <CardDescription>Rotate the data encryption key. All existing data will be re-encrypted with the new key.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="mt-4">
            <Button variant="secondary">Rotate Encryption Key</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
