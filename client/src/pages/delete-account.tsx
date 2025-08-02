import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/hooks/useLanguage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DeleteAccount() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/users/me");
    },
    onSuccess: () => {
      toast({
        title: t("accountDeleted"),
        description: t("accountDeletedSuccessfully"),
      });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: t("accountDeleteFailed"),
        variant: "destructive",
      });
    },
  });

  const handleDeleteAccount = () => {
    if (deleteConfirmed) {
      deleteAccountMutation.mutate();
      setShowDeleteConfirm(false);
      setDeleteConfirmed(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-md mx-auto p-4 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/settings/account")}
            className="rounded-full hover:bg-lavender/10"
          >
            <ArrowLeft className="h-5 w-5 text-gray-custom" />
          </Button>
          <h1 className="text-xl font-bold text-gray-custom">
            {t("deleteAccountTitle")}
          </h1>
        </div>

        {/* Warning Card */}
        <Card className="mb-6 bg-gradient-to-br from-red-50 to-orange-50 border-red-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {t("deleteAccountWarningTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-red-700 font-medium">
                {t("deleteAccountWarningDescription")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="mb-6 bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-gray-custom">
              {t("beforeYouDelete")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-gray-custom">
                  {t("alternativeOptions")}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {t("contactSupportFirst")}
                </p>
              </div>
              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => setLocation("/help-support")}
                  className="w-full border-mint/30 text-mint hover:bg-mint/5"
                >
                  {t("contactSupportInstead")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-gray-custom">
              {t("confirmDeletion")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="deleteConfirm"
                  checked={deleteConfirmed}
                  onCheckedChange={setDeleteConfirmed}
                />
                <Label htmlFor="deleteConfirm" className="text-sm text-gray-600 leading-relaxed">
                  {t("deleteAccountConfirmation")}
                </Label>
              </div>
              
              <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={!deleteConfirmed}
                  >
                    {t("permanentDeletion")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("deleteAccountWarningTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("deleteAccountWarningDescription")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {t("permanentDeletion")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}